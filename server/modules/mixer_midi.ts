const midi = require('@julusian/midi')

const input = new midi.Input();
const output = new midi.Output();
let listener: ((message: number[]) => void) | false = false;
const inputPortCount = input.getPortCount();
const outputPortCount = output.getPortCount();
let foundInputPort = false;
let foundOutputPort = false;
let i;

const matchPortName = function(name: string) {
    return (name.toLowerCase().indexOf('01v96') !== -1 || name.match(/01V96 ..:0/i));
};

const transmitMessage = function(deltaTime: number, message: number[]) {
    if(listener) {
        listener(message);
    }
};

input.on('message', transmitMessage);

// find input port

for(i = 0; i < inputPortCount; i++) {
    if(matchPortName(input.getPortName(i))) {

        console.log('[mixer_midi] MIDI input port ' + i + ' / ' + input.getPortName(i));

        input.openPort(i);

        foundInputPort = true;

        // enable Sysex, timing and active sensing
        input.ignoreTypes(false, false, false);

        break;
    }
}

if(!foundInputPort) {
    console.log('[mixer_midi] ERROR: No 01v96 device found! (input port)');
}


// find output port

for(i = 0; i < outputPortCount; i++) {
    if(matchPortName(output.getPortName(i))) {

        console.log('[mixer_midi] MIDI output port ' + i + ' / ' + output.getPortName(i));

        output.openPort(i);

        foundOutputPort = true;

        break;
    }
    console.log('[mixer_midi] MIDI output port ' + i + ' / ' + output.getPortName(i) + ' does not match.');
}

if(!foundOutputPort) {
    console.log('[mixer_midi] ERROR: No 01v96 device found! (output port)');
}


export {};

module.exports = {
    
    setListener: function(l: (message: number[]) => void) {
        listener = l;
    },
    
    send: function(message: number[]) {
        if(foundOutputPort) {
            output.sendMessage(message);
        }
    }
    
};
