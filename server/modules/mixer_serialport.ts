const SerialPort = require("serialport");
const fs = require("fs");

interface SerialPortLike {
    on(event: string, listener: (data: Buffer) => void): void;
    write(message: number[]): void;
    close(callback?: (error?: Error) => void): void;
}

module.exports = {
    create: function() {
        let listener: ((message: number[]) => void) | undefined;
        let portOpened = false;
        let serialPort: SerialPortLike | undefined;

        if (fs.existsSync("/dev/ttyAMA0")) {
            const port: SerialPortLike = new SerialPort("/dev/ttyAMA0", { baudRate: 38400 });
            serialPort = port;

            port.on("open", function() {
                console.log("[mixer_serialport] Serial port opened");
                portOpened = true;

                let message: number[] = [];
                port.on("data", function(data: Buffer) {
                    let obj = Array.from(data);
                    let startPosition;
                    let endPosition;

                    while (obj.length) {
                        startPosition = obj.indexOf(240);
                        endPosition = obj.indexOf(247);

                        if (startPosition === 0) {
                            if (endPosition !== -1) {
                                message = obj.slice(0, endPosition + 1);
                                obj = obj.slice(endPosition + 1);
                                listener?.(message);
                                message = [];
                            } else {
                                message = obj;
                                return;
                            }
                        } else if (message.length) {
                            if (endPosition !== -1) {
                                message = message.concat(obj.slice(0, endPosition + 1));
                                obj = obj.slice(endPosition + 1);
                                listener?.(message);
                                message = [];
                            } else {
                                message = message.concat(obj);
                                return;
                            }
                        } else if (startPosition > 0) {
                            obj = obj.slice(startPosition + 1);
                        } else {
                            return;
                        }
                    }
                });
            });
        } else {
            console.log("[mixer_serialport] ERROR: /dev/ttyAMA0 does not exist! Aborting...");
        }

        return {
            setListener: function(nextListener: (message: number[]) => void) {
                listener = nextListener;
            },
            send: function(message: number[]) {
                if (portOpened && serialPort) serialPort.write(message);
            },
            close: function() {
                listener = undefined;
                if (portOpened && serialPort) {
                    serialPort.close(function(error) {
                        if (error) console.log("[mixer_serialport] Could not close serial port:", error);
                    });
                    portOpened = false;
                }
            }
        };
    }
};
