import * as fs from "node:fs";
import * as os from "node:os";
import * as path from "node:path";
import type { Application } from "../types";
import type { MixerDevice, MixerStatus } from "./mixer-types";
import { config } from "./mixer-config";
import { createDeviceMessageHandler } from "./mixer-device-messages";
import { createClientMessageHandler } from "./mixer-client-messages";
import { createMixerCommands } from "./mixer-commands";
import { createMixerRequests } from "./mixer-requests";

type DeviceWithLifecycle = MixerDevice & { close?: () => void };
type MidiDeviceModule = MixerDevice & {
    listPorts(): string[];
    open(portName: string): void;
    close(): void;
};
type ConnectionMode = "midi" | "dummy" | "serialport";
type ConnectionSettings = { mode: ConnectionMode; portName: string | null };

let app: Application,
    activeDevice: DeviceWithLifecycle | undefined,
    deviceListener: ((message: number[]) => void) | undefined,
    requestMixerState: (() => void) | undefined,
    connection: ConnectionSettings = { mode: "midi", portName: null },
    connectionError: string | null = null;

const device: MixerDevice = {
    setListener: function(listener) {
        deviceListener = listener;
        activeDevice?.setListener(listener);
    },
    send: function(message) {
        activeDevice?.send(message);
    }
};

const settingsPath = path.join(
    process.env.APPDATA || path.join(os.homedir(), ".config"),
    "01v96-remote",
    "connection.json"
);

function readSettings(): ConnectionSettings | undefined {
    try {
        const saved = JSON.parse(fs.readFileSync(settingsPath, "utf8")) as Partial<ConnectionSettings>;
        if (saved.mode === "midi" || saved.mode === "dummy" || saved.mode === "serialport") {
            return { mode: saved.mode, portName: typeof saved.portName === "string" ? saved.portName : null };
        }
        console.log("[mixer] Ignoring invalid saved connection settings");
    } catch (error) {
        if ((error as NodeJS.ErrnoException).code !== "ENOENT") {
            console.log("[mixer] Could not load connection settings:", error);
        }
    }
    return undefined;
}

function saveSettings(settings: ConnectionSettings): void {
    try {
        fs.mkdirSync(path.dirname(settingsPath), { recursive: true });
        fs.writeFileSync(settingsPath, JSON.stringify(settings, null, 2));
    } catch (error) {
        console.log("[mixer] Could not save connection settings:", error);
        throw error;
    }
}

function startupSettings(): { settings: ConnectionSettings; explicit: boolean } {
    const args = process.argv.slice(2);
    const saved = readSettings();
    let mode = saved?.mode || "midi";
    let portName = saved?.portName || null;
    let explicit = false;

    for (let i = 0; i < args.length; i++) {
        const arg = args[i];
        if (arg === "--mode" && args[i + 1]) {
            mode = args[++i] as ConnectionMode;
            explicit = true;
            portName = null;
        } else if (arg.startsWith("--mode=")) {
            mode = arg.slice("--mode=".length) as ConnectionMode;
            explicit = true;
            portName = null;
        } else if ((arg === "--midi-port" || arg === "--port") && args[i + 1]) {
            mode = "midi";
            portName = args[++i];
            explicit = true;
        } else if (arg === "midi" || arg === "dummy" || arg === "serialport") {
            mode = arg;
            explicit = true;
            portName = null;
            if (mode === "midi" && args[i + 1] && !args[i + 1].startsWith("--")) {
                portName = args[++i];
            }
        }
    }

    if (mode !== "midi" && mode !== "dummy" && mode !== "serialport") {
        console.log("[mixer] Invalid connection mode; using MIDI");
        mode = "midi";
        portName = null;
    }
    return { settings: { mode, portName }, explicit };
}

function midiModule(): MidiDeviceModule {
    return require("../modules/mixer_midi") as MidiDeviceModule;
}

function listMidiPorts(): string[] {
    try {
        return midiModule().listPorts();
    } catch (error) {
        connectionError = String(error);
        console.log("[mixer] Could not enumerate MIDI ports:", error);
        return [];
    }
}

function availableModes(): ConnectionMode[] {
    const modes: ConnectionMode[] = ["midi", "dummy"];
    if (process.platform !== "win32" && fs.existsSync("/dev/ttyAMA0")) modes.push("serialport");
    return modes;
}

function setConnection(settings: ConnectionSettings): void {
    if (!availableModes().includes(settings.mode)) {
        throw new Error("The selected connection mode is not available on this system");
    }
    if (settings.mode === "midi" && !settings.portName) {
        throw new Error("Select a detected 01V96 MIDI port");
    }

    const previousDevice = activeDevice;
    activeDevice = undefined;
    previousDevice?.close?.();

    if (settings.mode === "midi") {
        const midi = midiModule();
        midi.setListener(deviceListener || (() => undefined));
        midi.open(settings.portName!);
        activeDevice = midi;
        console.log("[mixer] Using standard MIDI controller");
    } else if (settings.mode === "dummy") {
        const dummyModule = require("../modules/mixer_dummy") as {
            create(): DeviceWithLifecycle;
        };
        activeDevice = dummyModule.create();
        activeDevice.setListener(deviceListener || (() => undefined));
        console.log("[mixer] Using MIDI test dummy");
    } else {
        const serialModule = require("../modules/mixer_serialport") as {
            create(): DeviceWithLifecycle;
        };
        activeDevice = serialModule.create();
        activeDevice.setListener(deviceListener || (() => undefined));
        console.log("[mixer] Using MIDI serial port adapter");
    }

    connection = settings;
    connectionError = null;
    requestMixerState?.();
}

function connectionInfo() {
    return {
        type: "connection",
        mode: connection.mode,
        portName: connection.portName,
        connected: !!activeDevice,
        modes: availableModes(),
        ports: listMidiPorts(),
        error: connectionError
    };
}

function connectionMessageHandler(message: any, socket: any): void {
    if (message.type === "connection_info") {
        app.controllers.socket.send(socket, connectionInfo());
    } else if (message.type === "connection_select") {
        const previousConnection = connection;
        const previousDevice = activeDevice;
        try {
            if (message.mode !== "midi" && message.mode !== "dummy" && message.mode !== "serialport") {
                throw new Error("Invalid connection mode");
            }
            const settings: ConnectionSettings = {
                mode: message.mode,
                portName: typeof message.portName === "string" ? message.portName : null
            };
            setConnection(settings);
            saveSettings(connection);
            app.controllers.socket.broadcast(connectionInfo());
        } catch (error) {
            connectionError = error instanceof Error ? error.message : String(error);
            console.log("[mixer] Could not change connection:", error);
            if (connection !== previousConnection || activeDevice !== previousDevice) {
                app.controllers.socket.broadcast(connectionInfo());
            }
            app.controllers.socket.send(socket, connectionInfo());
        }
    }
}


const init = function () {

    const startup = startupSettings();
    try {
        if (startup.settings.mode === "midi" && !startup.settings.portName) {
            connection = startup.settings;
            console.log("[mixer] Using standard MIDI controller");
            console.log("[mixer] No MIDI console selected");
            if (startup.explicit) saveSettings(connection);
        } else {
            setConnection(startup.settings);
            if (startup.explicit) saveSettings(connection);
        }
    } catch (error) {
        connectionError = error instanceof Error ? error.message : String(error);
        console.log("[mixer] Could not start selected connection:", error);
    }

    const commands = createMixerCommands(config, status, device);
    const requests = createMixerRequests(config, status, device);
    requestMixerState = function() {
        requests.sendFaderNameRequest();
        requests.sendAuxNameRequest();
        requests.sendBusNameRequest();
        requests.sendSumNameRequest();
        requests.sendRemoteMeterRequest();
        requests.sendSyncRequest();
    };

    device.setListener(createDeviceMessageHandler(app, config, status, requests.sendSyncRequest));
    app.controllers.socket.addListener(
        createClientMessageHandler(
            app,
            config,
            status,
            commands,
            requests.sendChannelEffectRequest,
            requests.sendChannelPanRequest
        )
    );
    app.controllers.socket.addListener(connectionMessageHandler);


    fillStatus();

    // request input names before the rest of the mixer state
    requests.sendFaderNameRequest();

    // periodical remote meter request
    requests.sendRemoteMeterRequest();
    setInterval(requests.sendRemoteMeterRequest, 10000);

    // periodical channel, aux, bus name request (charwise)
    setInterval(requests.sendFaderNameRequest, config.remoteNameInterval);
    requests.sendAuxNameRequest();
    setInterval(requests.sendAuxNameRequest, config.remoteNameInterval);
    requests.sendBusNameRequest();
    setInterval(requests.sendBusNameRequest, config.remoteNameInterval);
    requests.sendSumNameRequest();
    setInterval(requests.sendSumNameRequest, config.remoteNameInterval);

    // periodical sync request
    requests.sendSyncRequest();
    setInterval(requests.sendSyncRequest, 17000);

};



const status: MixerStatus = {

    on: {
        sum0: false,
        solo1: false
    },
    fader: {
        sum0: 0,
        solo1: 0
    },
    faderName: {
        sum0: 'STEREO',
        solo1: 'SOLO'
    },
    faderEffect: {
        main: {
            Pan: {
                sum0: 0
            },
            Phase: {
                sum0: 0
            },
            Stereo: {
                sum0: 0
            },
            FollowPan: {
                sum0: 0
            },
            Direct: {
                sum0: 0
            },
            Bus1: {
                sum0: 0
            },
            Bus2: {
                sum0: 0
            },
            Bus3: {
                sum0: 0
            },
            Bus4: {
                sum0: 0
            },
            Bus5: {
                sum0: 0
            },
            Bus6: {
                sum0: 0
            },
            Bus7: {
                sum0: 0
            },
            Bus8: {
                sum0: 0
            }
        },
        gate: {
            On: {
                sum0: false
            },
            Link: {
                sum0: 0
            },
            KeyIn: {
                sum0: 0
            },
            KeyAUX: {
                sum0: 0
            },
            KeyCh: {
                sum0: 0
            },
            Type: {
                sum0: 0
            },
            Attac: {
                sum0: 0
            },
            Range: {
                sum0: 0
            },
            Hold: {
                sum0: 0
            },
            Decay: {
                sum0: 0
            },
            Threshold: {
                sum0: 0
            }
        },
        comp: {
            LocComp: {
                sum0: 0
            },
            On: {
                sum0: false
            },
            Link: {
                sum0: 0
            },
            Type: {
                sum0: 0
            },
            Attac: {
                sum0: 0
            },
            Release: {
                sum0: 0
            },
            Ratio: {
                sum0: 0
            },
            Gain: {
                sum0: 0
            },
            Knee: {
                sum0: 0
            },
            Threshold: {
                sum0: 0
            }
        },
        eq: {
            Mode: {
                sum0: 0
            },
            LowQ: {
                sum0: 0
            },
            LowF: {
                sum0: 0
            },
            LowG: {
                sum0: 0
            },
            HPFOn: {
                sum0: false
            },
            LowMidQ: {
                sum0: 0
            },
            LowMidF: {
                sum0: 0
            },
            LowMidG: {
                sum0: 0
            },
            HiMidQ: {
                sum0: 0
            },
            HiMidF: {
                sum0: 0
            },
            HiMidG: {
                sum0: 0
            },
            HiQ: {
                sum0: 0
            },
            HiF: {
                sum0: 0
            },
            HiG: {
                sum0: 0
            },
            LPFOn: {
                sum0: false
            },
            On: {
                sum0: false
            }
        },
        delay: {
            On: {
                sum0: false
            },
            Mix: {
                sum0: 0
            },
            FBGain: {
                sum0: 0
            },
            Time: {
                sum0: 0
            }
        },
    },
    faderPair: {
        sum0: 0
    }

};

/**
 * Fills status object with zero-values
 */
const fillStatus = function () {
    let i, j, x;

    // channels

    i = config.channelCount + 1;

    while (--i) {
        status.on['channel' + i] = false;
        status.fader['channel' + i] = 0;
        status.faderEffect['main']['Pan']['channel' + i] = 0;
        status.faderName['channel' + i] = 'CH' + i;
        status.faderPair['channel' + i] = 0;
        for (x in status.faderEffect){
            for (j in status.faderEffect[x]) {
                status.faderEffect[x][j]['channel' + i] = 0;
            };
        }
    }


    // aux sends

    j = config.auxSendCount + 1;

    while (--j) {
        i = config.channelCount + 1;

        while (--i) {
            status.fader['auxsend' + j + i] = 0;
            status.faderEffect['main']['Pan']['auxsend' + j + i] = 0;
            status.faderName['auxsend' + j + i] = 'AUXSEND ' + i;
        }
    }


    // master aux

    i = config.auxCount + 1;

    while (--i) {
        status.on['aux' + i] = false;
        status.fader['aux' + i] = 0;
        status.faderName['aux' + i] = 'AUX ' + i;
        status.faderPair['aux' + i] = 0;
    }

    // master bus

    i = config.busCount + 1;

    while (--i) {
        status.on['bus' + i] = false;
        status.fader['bus' + i] = 0;
        status.faderName['bus' + i] = 'BUS ' + i;
        status.faderPair['bus' + i] = 0;
    }

};


export {};

module.exports = function (globalApp: Application) {
    app = globalApp;
    app.events.on('ready', init);
};
