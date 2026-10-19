import type { Application } from "../types";
import type { MixerConfig, MixerStatus } from "./mixer-types";

export function createDeviceMessageHandler(
    app: Application,
    config: MixerConfig,
    status: MixerStatus,
    sendSyncRequest: () => void
) {
    let messageCache: number[] | false = false;
    let meterFilterCount = 0;
    let faderNameCache = '';
    const channelNameCache: string[][] = [];

    return function deviceMessageHandler(message: number[]) {
        let outMessage: Record<string, any> | false = false,
            num, num2, value, i, property;

        const messageBeginsWith = function (search: number[]) {
                const length = search.length;
                let i;

                if (message.length < search.length) {
                    return false;
                }

                for (i = 0; i < length; i++) {
                    if (message[i] !== search[i]) {
                        return false;
                    }
                }

                return true;
            };

        const aboveThreshold = function (val1: number, val2: number) {
            return (Math.abs(val1 - val2) >= config.faderThreshold);
        };

        // concatenate messages that are longer than the 1024 byte limit
        if (message[0] == 240 && message.length == 1024) {
            messageCache = message;
            return;
        }
        else if (messageCache && message[message.length - 1] == 247) {
            message = messageCache.concat(message);
            messageCache = false;
        }
        else if (messageCache && message.length == 1024) {
            messageCache = messageCache.concat(message);
            return;
        }
        else {
            messageCache = false;
        }

        // analyze message

        // sysEx message
        if (messageBeginsWith(config.sysExStart) ) {

            // program change -> sync again
            if (message[5] == 16) {
                sendSyncRequest();
                return;
            }
            // fader or on-button messages and effects
            else {
                switch (message[6]) {

                    case config.sysExElements.channelEffect['gate']:
                        num = message[8] + 1;
                        value = config.data2Value(message.slice(9));

                        status.faderEffect['gate'][Object.keys(status.faderEffect['gate'])[message[7]]]['channel' + num] = value;

                        outMessage = {
                            type: 'faderEffect',
                            target: 'gate',
                            num: num,
                            value: value,
                            prop: Object.keys(status.faderEffect['gate'])[message[7]],
                            faderType: 'channel'
                        };

                        break;

                    case config.sysExElements.channelEffect['comp']:
                        num = message[8] + 1;
                        value = config.data2Value(message.slice(9));
                        status.faderEffect['comp'][Object.keys(status.faderEffect['comp'])[message[7]]]['channel' + num] = value;

                        outMessage = {
                            type: 'faderEffect',
                            target: "comp",
                            num: num,
                            value: value,
                            prop: Object.keys(status.faderEffect['comp'])[message[7]],
                            faderType: 'channel'
                        };

                        break;

                    case config.sysExElements.channelEffect['eq']:
                        num = message[8] + 1;
                        value = config.data2Value(message.slice(9));

                        status.faderEffect['eq'][Object.keys(status.faderEffect['eq'])[message[7]]]['channel' + num] = value;

                        outMessage = {
                            type: 'faderEffect',
                            target: "eq",
                            num: num,
                            value: value,
                            prop: Object.keys(status.faderEffect['eq'])[message[7]],
                            faderType: 'channel'
                        };

                        break;

                    case config.sysExElements.channelEffect['delay']:
                        num = message[8] + 1;
                        value = config.data2Value(message.slice(9));

                        status.faderEffect['delay'][Object.keys(status.faderEffect['delay'])[message[7]]]['channel' + num] = value;

                        outMessage = {
                            type: 'faderEffect',
                            target: "delay",
                            num: num,
                            value: value,
                            prop: Object.keys(status.faderEffect['delay'])[message[7]],
                            faderType: 'channel'
                        };

                        break;

                    case config.sysExElements.channelPan:
                        num = message[8] + 1;
                        value = config.data2Value(message.slice(9));

                        status.faderEffect['main']['Pan']['channel' + num] = value;

                        outMessage = {
                            type: 'faderEffect',
                            target: "main",
                            num: num,
                            value: value,
                            prop: 'Pan',
                            faderType: 'channel'
                        };

                        break;

                    case config.sysExElements.sumEffect['comp']:
                        num = 0;
                        value = config.data2Value(message.slice(9));
                        status.faderEffect['comp'][Object.keys(status.faderEffect['comp'])[message[7]]]['sum0'] = value;

                        outMessage = {
                            type: 'faderEffect',
                            target: "comp",
                            num: num,
                            value: value,
                            prop: Object.keys(status.faderEffect['comp'])[message[7]],
                            faderType: 'sum'
                        };

                        break;

                    case config.sysExElements.sumEffect['eq']:
                        num = 0;
                        value = config.data2Value(message.slice(9));

                        status.faderEffect['eq'][Object.keys(status.faderEffect['eq'])[message[7]]]['sum0'] = value;

                        outMessage = {
                            type: 'faderEffect',
                            target: "eq",
                            num: num,
                            value: value,
                            prop: Object.keys(status.faderEffect['eq'])[message[7]],
                            faderType: 'sum'
                        };

                        break;

                    case config.sysExElements.sumEffect['delay']:
                        num = 0;
                        value = config.data2Value(message.slice(9));

                        if (message[7] == 0) {
                            property = "On"
                        } else {
                            property = "Time"
                        }
                        status.faderEffect['delay'][property]['sum0'] = value;

                        outMessage = {
                            type: 'faderEffect',
                            target: "delay",
                            num: num,
                            value: value,
                            prop: property,
                            faderType: 'sum'
                        };

                        break;

                    case config.sysExElements.sumPan:
                        num = 0;
                        value = config.data2Value(message.slice(9));

                        status.faderEffect['main']['Pan']['sum0'] = value;

                        outMessage = {
                            type: 'faderEffect',
                            target: "main",
                            num: num,
                            value: value,
                            prop: 'Pan',
                            faderType: 'sum'
                        };

                        break;

                    case config.sysExElements.auxEffect['comp']:
                        num = message[8] + 1;
                        value = config.data2Value(message.slice(9));
                        status.faderEffect['comp'][Object.keys(status.faderEffect['comp'])[message[7]]]['aux' + num] = value;

                        outMessage = {
                            type: 'faderEffect',
                            target: "comp",
                            num: num,
                            value: value,
                            prop: Object.keys(status.faderEffect['comp'])[message[7]],
                            faderType: 'aux'
                        };

                        break;

                    case config.sysExElements.auxEffect['eq']:
                        num = message[8] + 1;
                        value = config.data2Value(message.slice(9));

                        status.faderEffect['eq'][Object.keys(status.faderEffect['eq'])[message[7]]]['aux' + num] = value;

                        outMessage = {
                            type: 'faderEffect',
                            target: "eq",
                            num: num,
                            value: value,
                            prop: Object.keys(status.faderEffect['eq'])[message[7]],
                            faderType: 'aux'
                        };

                        break;

                    case config.sysExElements.auxEffect['delay']:
                        num = message[8] + 1;
                        value = config.data2Value(message.slice(9));

                        if (message[7] == 0) {
                            property = "On"
                        } else {
                            property = "Time"
                        }
                        status.faderEffect['delay'][property]['aux' + num] = value;

                        outMessage = {
                            type: 'faderEffect',
                            target: "delay",
                            num: num,
                            value: value,
                            prop: property,
                            faderType: 'aux'
                        };

                        break;

                    case config.sysExElements.auxPan:
                        num = message[8] + 1;
                        value = config.data2Value(message.slice(9));

                        status.faderEffect['main']['Pan']['aux' + num] = value;

                        outMessage = {
                            type: 'faderEffect',
                            target: "main",
                            num: num,
                            value: value,
                            prop: 'Pan',
                            faderType: 'aux'
                        };

                        break;

                    case config.sysExElements.busEffect['comp']:
                        num = message[8] + 1;
                        value = config.data2Value(message.slice(9));
                        status.faderEffect['comp'][Object.keys(status.faderEffect['comp'])[message[7]]]['bus' + num] = value;

                        outMessage = {
                            type: 'faderEffect',
                            target: "comp",
                            num: num,
                            value: value,
                            prop: Object.keys(status.faderEffect['comp'])[message[7]],
                            faderType: 'bus'
                        };

                        break;

                    case config.sysExElements.busEffect['eq']:
                        num = message[8] + 1;
                        value = config.data2Value(message.slice(9));

                        status.faderEffect['eq'][Object.keys(status.faderEffect['eq'])[message[7]]]['bus' + num] = value;

                        outMessage = {
                            type: 'faderEffect',
                            target: "eq",
                            num: num,
                            value: value,
                            prop: Object.keys(status.faderEffect['eq'])[message[7]],
                            faderType: 'bus'
                        };

                        break;

                    case config.sysExElements.busEffect['delay']:
                        num = message[8] + 1;
                        value = config.data2Value(message.slice(9));

                        if (message[7] == 0) {
                            property = "On"
                        } else {
                            property = "Time"
                        }
                        status.faderEffect['delay'][property]['bus' + num] = value;

                        outMessage = {
                            type: 'faderEffect',
                            target: "delay",
                            num: num,
                            value: value,
                            prop: property,
                            faderType: 'bus'
                        };

                        break;

                    case config.sysExElements.busPan:
                        num = message[8] + 1;
                        value = config.data2Value(message.slice(9));

                        status.faderEffect['main']['Pan']['bus' + num] = value;

                        outMessage = {
                            type: 'faderEffect',
                            target: "main",
                            num: num,
                            value: value,
                            prop: 'Pan',
                            faderType: 'bus'
                        };

                        break;

                    case config.sysExElements.channelPhase:
                        num = message[8] + 1;
                        value = config.data2Value(message.slice(9));

                        status.faderEffect['main']['Phase']['channel' + num] = value;

                        outMessage = {
                            type: 'faderEffect',
                            target: "main",
                            num: num,
                            value: value,
                            prop: 'Phase'
                        };

                        break;

                    case config.sysExElements.channelRouting:
                        num = message[8] + 1;
                        value = config.data2Value(message.slice(9));

                        status.faderEffect['main'][Object.keys(status.faderEffect['main'])[message[7]+2]]['channel' + num] = value;

                        outMessage = {
                            type: 'faderEffect',
                            target: "main",
                            num: num,
                            value: value,
                            prop: Object.keys(status.faderEffect['main'])[message[7]+2]
                        };

                        break;

                    case config.sysExElements.channelPair:
                        if (message[7] !== 0) {
                            break;
                        }

                        num = message[8] + 1;
                        value = config.data2Value(message.slice(9));
                        status.faderPair['channel' + num] = value;

                        outMessage = {
                            type: 'faderPair',
                            target: "channel",
                            num: num,
                            prop: 'Pair',
                            value: value
                        };

                        break;

                    case config.sysExElements.channelAttenuator:
                        if (message[7] !== 0) {
                            break;
                        }

                        num = message[8] + 1;
                        value = config.data2Value(message.slice(9));
                        status.faderEffect['eq']['Att']['channel' + num] = value;

                        outMessage = {
                            type: 'faderEffect',
                            target: 'eq',
                            num: num,
                            value: value,
                            prop: 'Att',
                            faderType: 'channel'
                        };

                        break;

                    case config.sysExElements.channelFader:
                        num = message[8] + 1;
                        value = config.data2Value(message.slice(9));

                        if (!aboveThreshold(value, status.fader['channel' + num])) {
                            return;
                        }

                        status.fader['channel' + num] = value;

                        outMessage = {
                            type: "fader",
                            target: "channel",
                            num: num,
                            value: value
                        };
                        break;


                    case config.sysExElements.sumFader:
                        value = config.data2Value(message.slice(9));

                        if (!aboveThreshold(value, status.fader['sum0'])) {
                            return;
                        }

                        status.fader['sum0'] = value;

                        outMessage = {
                            type: "fader",
                            target: "sum",
                            num: 0,
                            value: value
                        };
                        break;

                    case config.sysExElements.auxSendFader:
                        num = message[8] + 1;
                        num2 = (message[7] + 1) / 3;
                        value = config.data2Value(message.slice(9));

                        if (!aboveThreshold(value, status.fader['auxsend' + num2 + num])) {
                            return;
                        }

                        status.fader['auxsend' + num2 + num] = value;

                        outMessage = {
                            type: "fader",
                            target: "auxsend",
                            num: num,
                            num2: num2,
                            value: value
                        };
                        break;

                    case config.sysExElements.auxPair:
                        num = message[8] + 1;
                        value = config.data2Value(message.slice(9));
                        status.faderPair['aux' + num] = value;

                        outMessage = {
                            type: 'faderPair',
                            target: "aux",
                            num: num,
                            prop: Object.keys(status.faderPair)[message[7]],
                            value: value
                        };

                        break;

                    case config.sysExElements.auxFader:
                        num = message[8] + 1;
                        value = config.data2Value(message.slice(9));

                        if (!aboveThreshold(value, status.fader['aux' + num])) {
                            return;
                        }

                        status.fader['aux' + num] = value;

                        outMessage = {
                            type: "fader",
                            target: "aux",
                            num: num,
                            value: value
                        };
                        break;


                    case config.sysExElements.busPair:
                        num = message[8] + 1;
                        value = config.data2Value(message.slice(9));
                        status.faderPair['bus' + num] = value;

                        outMessage = {
                            type: 'faderPair',
                            target: "bus",
                            num: num,
                            prop: Object.keys(status.faderPair)[message[7]],
                            value: value
                        };

                        break;

                    case config.sysExElements.busFader:
                        num = message[8] + 1;
                        value = config.data2Value(message.slice(9));

                        if (!aboveThreshold(value, status.fader['bus' + num])) {
                            return;
                        }

                        status.fader['bus' + num] = value;

                        outMessage = {
                            type: "fader",
                            target: "bus",
                            num: num,
                            value: value
                        };
                        break;

                    case config.sysExElements.channelOn:
                        num = message[8] + 1;
                        value = config.data2On(message.slice(9));

                        if (value === status.on['channel' + num]) {
                            return;
                        }

                        status.on['channel' + num] = value;

                        outMessage = {
                            type: "on",
                            target: "channel",
                            num: num,
                            value: value
                        };
                        break;

                    case config.sysExElements.sumOn:
                        value = config.data2On(message.slice(9));

                        if (value === status.on['sum0']) {
                            return;
                        }

                        status.on['sum0'] = value;

                        outMessage = {
                            type: "on",
                            target: "sum",
                            num: 0,
                            value: value
                        };
                        break;

                    case config.sysExElements.auxOn:
                        num = message[8] + 1;
                        value = config.data2On(message.slice(9));

                        if (value === status.on['aux' + num]) {
                            return;
                        }

                        status.on['aux' + num] = value;

                        outMessage = {
                            type: "on",
                            target: "aux",
                            num: num,
                            value: value
                        };
                        break;

                    case config.sysExElements.busOn:
                        num = message[8] + 1;
                        value = config.data2On(message.slice(9));

                        if (value === status.on['bus' + num]) {
                            return;
                        }

                        status.on['bus' + num] = value;

                        outMessage = {
                            type: "on",
                            target: "bus",
                            num: num,
                            value: value
                        };
                        break;

                }

            }
        }
        if (
            messageBeginsWith([0xF0, 0x43, 0x10, 0x3E, 0x1A]) &&
            message[5] === 2 &&
            message[6] === 4 &&
            message[7] >= 0x04 &&
            message[7] <= 0x13 &&
            message[8] <= 0x1F &&
            message.length >= 14
        ) {
            const channel = message[8];
            const character = message[7] - 0x04;
            if (!channelNameCache[channel]) {
                channelNameCache[channel] = Array(16).fill(' ');
            }
            channelNameCache[channel][character] = String.fromCharCode(message[12]) || ' ';

            if (character === 15) {
                const name = channelNameCache[channel].join('').trimEnd();
                status.faderName['channel' + (channel + 1)] = name;
                outMessage = {
                    type: "faderName",
                    target: "channel",
                    num: channel + 1,
                    value: name
                };
            }
        } else if (messageBeginsWith(config.sysExStartSpecific) ) {
            // program change -> sync again
            if (message[5] == 16) {
                sendSyncRequest();
                return;
            // fader names
            }else if (message[5] == 2 && message[6] == 4) {
                faderNameCache += String.fromCharCode(message[12]) || ' ';
                if (message[7] - 4 == 15) {
                    outMessage = {
                        type: "faderName",
                        target: "channel",
                        num: message[8] + 1,
                        value: faderNameCache
                    };
                    faderNameCache = '';
                    status.faderName['channel' + outMessage.num] = outMessage.value;
                }
            // BUS fader names
            } else if (message[5] == 2 && message[6] == 15) {
                faderNameCache += String.fromCharCode(message[12]) || ' ';
                if (message[7] - 4 == 15) {
                    outMessage = {
                        type: "busName",
                        target: "channel",
                        num: message[8] + 1,
                        value: faderNameCache
                    };
                    faderNameCache = '';
                    status.faderName['bus' + outMessage.num] = outMessage.value;
                }
            // AUX fader names
            } else if (message[5] == 2 && message[6] == 16) {
                faderNameCache += String.fromCharCode(message[12]) || ' ';
                if (message[7] - 4 == 15) {
                    outMessage = {
                        type: "auxName",
                        target: "channel",
                        num: message[8] + 1,
                        value: faderNameCache
                    };
                    faderNameCache = '';
                    status.faderName['aux' + outMessage.num] = outMessage.value;
                }
            // SUM fader names
            } else if (message[5] == 2 && message[6] == 18) {
                faderNameCache += String.fromCharCode(message[12]) || ' ';
                if (message[7] - 4 == 15) {
                    outMessage = {
                        type: "sumName",
                        target: "channel",
                        num: message[8],
                        value: faderNameCache
                    };
                    faderNameCache = '';
                    status.faderName['sum' + outMessage.num] = outMessage.value;
                }
            // remote meter - levels
            } else if (message[5] == 33) {
                // echo messages from meter requests are accidentally
                // recognized as meter messages
                // alternatively more analysis of message header needed
                if (message.length < 13) {
                    return;
                }

                // do not forward every meter level message
                if(message[6] == 0) {
                    meterFilterCount++;
               }

                if (meterFilterCount === config.remoteMeterInterval) {
                    meterFilterCount = 0;
                }

                if (meterFilterCount !== 0) {
                    return;
                }

                outMessage = {
                    type: "level",
                    target: (message[6] == 0 ? "channel" : (message[6] == 1 ? "bus" : (message[6] == 2 ? "aux" : "sum"))),
                    levels: {},
                    prop: message[7]
                };

                for (i = 0; message[9 + 2 * i] != 247; i++) {
                    outMessage.levels[i + 1] = message[(9 + 2 * i)];
                }
            }
        }

        if (outMessage) {
            app.controllers.socket.broadcast(outMessage);
        }
        // log unknown messages
        else {
            //console.log('[mixer] Unknown MIDI message: [' + message + ']');
        }
    };
    };
