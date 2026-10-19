// connect to Raspberry Pi serial port
const SerialPort = require('serialport'),
    fs = require('fs');

interface SerialPortLike {
    on(event: string, listener: (data: Buffer) => void): void;
    write(message: number[]): void;
}

let listener: ((message: number[]) => void) | false = false,
    portOpened = false,
    serialPort: SerialPortLike | false = false;

if(fs.existsSync('/dev/ttyAMA0')) {
    const port: SerialPortLike = new SerialPort('/dev/ttyAMA0', {
        baudRate: 38400
    });
    serialPort = port;

    port.on('open', function() {

        console.log('[mixer_serialport] Serial port opened');

        portOpened = true;

        let message: number[] = [];

        // collect parameter changes and emit to controller
        port.on('data', function(data) {
            let obj = Array.from(data),
                startPosition,
                endPosition;

            while(true) {
                if(!obj.length) {
                    return;
                }

                startPosition = obj.indexOf(240);
                endPosition = obj.indexOf(247);

                // 240 ...
                if(startPosition === 0) {
                    // 240 ... 247 ... --> send
                    if(endPosition !== -1) {
                        message = obj.slice(0, endPosition+1);
                        obj = obj.slice(endPosition+1);

                        transmitMessage(message);
                        message = [];
                    }
                    // 240 ... |
                    else {
                        message = obj;
                        return;
                    }
                }
                // ... ; message already started, concatenate
                else if(message.length) {
                    // ... 247 | -> send
                    if(endPosition != -1) {
                        message = message.concat(obj.slice(0, endPosition+1));
                        obj = obj.slice(endPosition+1);

                        transmitMessage(message);
                        message = [];
                    }
                    // ... |
                    else {
                        message = message.concat(obj);
                        return;
                    }
                }
                // ... 240; skip unknown message part
                else if(startPosition > 0) {
                    obj = obj.slice(startPosition+1);
                }
                // ... ; message not started, skip
                else {
                    return;
                }

            }

        });

    });
}
else {
    console.log('[mixer_serialport] ERROR: /dev/ttyAMA0 does not exist! Aborting...');
}



const transmitMessage = function(message: number[]) {
    if(listener) {
        listener(message);
    }
};



export {};

module.exports = {

    setListener: function(l: (message: number[]) => void) {
        listener = l;
    },

    send: function(message: number[]) {
        if(portOpened && serialPort) {
            serialPort.write(message);
        }
    }

};
