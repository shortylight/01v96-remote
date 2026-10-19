import midi = require("@julusian/midi");

type MidiPort = {
    name: string;
    inputIndex: number;
    outputIndex: number;
};

let input: midi.Input | undefined;
let output: midi.Output | undefined;
let listener: ((message: number[]) => void) | undefined;

function findPorts(): MidiPort[] {
    const ports: MidiPort[] = [];
    const probeInput = new midi.Input();
    const probeOutput = new midi.Output();

    try {
        for (let inputIndex = 0; inputIndex < probeInput.getPortCount(); inputIndex++) {
            const name = probeInput.getPortName(inputIndex);
            if (!/01v96/i.test(name)) continue;

            for (let outputIndex = 0; outputIndex < probeOutput.getPortCount(); outputIndex++) {
                if (probeOutput.getPortName(outputIndex) === name) {
                    ports.push({ name, inputIndex, outputIndex });
                    break;
                }
            }
        }
    } finally {
        probeInput.destroy();
        probeOutput.destroy();
    }

    return ports;
}

function close(): void {
    if (input) {
        input.removeAllListeners("message");
        if (input.isPortOpen()) input.closePort();
        input.destroy();
        input = undefined;
    }

    if (output) {
        if (output.isPortOpen()) output.closePort();
        output.destroy();
        output = undefined;
    }
}

module.exports = {
    listPorts: function() {
        return findPorts().map((port) => port.name);
    },

    open: function(portName: string): void {
        const port = findPorts().find((candidate) => candidate.name === portName);
        if (!port) {
            throw new Error("The selected 01V96 MIDI input/output pair is not available");
        }

        close();
        const nextInput = new midi.Input();
        const nextOutput = new midi.Output();

        try {
            nextInput.ignoreTypes(false, false, false);
            nextInput.on("message", (_deltaTime, message) => listener?.(message));
            nextInput.openPort(port.inputIndex);
            nextOutput.openPort(port.outputIndex);
            input = nextInput;
            output = nextOutput;
            console.log("[mixer_midi] MIDI input port " + port.inputIndex + " / " + port.name);
            console.log("[mixer_midi] MIDI output port " + port.outputIndex + " / " + port.name);
        } catch (error) {
            if (nextInput.isPortOpen()) nextInput.closePort();
            if (nextOutput.isPortOpen()) nextOutput.closePort();
            nextInput.destroy();
            nextOutput.destroy();
            throw error;
        }
    },

    close: close,

    setListener: function(nextListener: (message: number[]) => void) {
        listener = nextListener;
    },

    send: function(message: number[]) {
        if (output?.isPortOpen()) output.sendMessage(message);
    }
};
