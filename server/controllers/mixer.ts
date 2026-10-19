import type { Application } from "../types";
import type { MixerDevice, MixerStatus } from "./mixer-types";
import { config } from "./mixer-config";
import { createDeviceMessageHandler } from "./mixer-device-messages";
import { createClientMessageHandler } from "./mixer-client-messages";
import { createMixerCommands } from "./mixer-commands";
import { createMixerRequests } from "./mixer-requests";

let app: Application,
    device: MixerDevice;


const init = function () {

    switch (process.argv[2]) {

        // MIDI over serial port, e.g. on the Raspberry Pi
        case 'serialport':
            console.log('[mixer] Using MIDI serial port adapter');
            device = require('../modules/mixer_serialport');
            break;

        // test dummy
        case 'dummy':
            console.log('[mixer] Using MIDI test dummy');
            device = require('../modules/mixer_dummy');
            break;

        // standard MIDI interface
        default:
            console.log('[mixer] Using standard MIDI controller');
            console.log('[mixer] Using port ' + process.argv[3]);
            device = require('../modules/mixer_midi');

    }

    const commands = createMixerCommands(config, status, device);
    const requests = createMixerRequests(config, status, device);

    device.setListener(createDeviceMessageHandler(app, config, status, requests.sendSyncRequest));
    app.controllers.socket.addListener(
        createClientMessageHandler(app, config, status, commands, requests.sendChannelEffectRequest)
    );


    // periodical remote meter request
    requests.sendRemoteMeterRequest();
    setInterval(requests.sendRemoteMeterRequest, 10000);

    // periodical channel, aux, bus name request (charwise)
    requests.sendFaderNameRequest();
    setInterval(requests.sendFaderNameRequest, config.remoteNameInterval);
    requests.sendAuxNameRequest();
    setInterval(requests.sendAuxNameRequest, config.remoteNameInterval);
    requests.sendBusNameRequest();
    setInterval(requests.sendBusNameRequest, config.remoteNameInterval);
    requests.sendSumNameRequest();
    setInterval(requests.sendSumNameRequest, config.remoteNameInterval);

    // periodical sync request
    fillStatus();
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
