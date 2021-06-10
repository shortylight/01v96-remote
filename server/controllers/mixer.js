var app,

    device,

    // cache object for larger MIDI transmissions
    messageCache = false,

    // runtime counter for config.remoteMeterInterval
    meterFilterCount = 0,

    // runtime channel name cache
    faderNameCache = '';


var init = function () {

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

    device.setListener(deviceMessageHandler);

    app.controllers.socket.addListener(clientMessageHandler);


    // periodical remote meter request
    sendRemoteMeterRequest();
    setInterval(sendRemoteMeterRequest, 10000);

    // periodical channel, aux, bus name request (charwise)
    sendFaderNameRequest();
    setInterval(sendFaderNameRequest, config.remoteNameInterval);
    sendAuxNameRequest();
    setInterval(sendAuxNameRequest, config.remoteNameInterval);
    sendBusNameRequest();
    setInterval(sendBusNameRequest, config.remoteNameInterval);
    sendSumNameRequest();
    setInterval(sendSumNameRequest, config.remoteNameInterval);

    // periodical sync request
    fillStatus();
    sendSyncRequest();
    setInterval(sendSyncRequest, 17000);

};



/**
 * device-specific configuration
 */
var config = {

    channelCount: 32,
    auxCount: 8,
    auxSendCount: 8,
    busCount: 8,

    faderThreshold: 1,

    // sysEx message beginnings, general and device-specific
    sysExStart: [240,
                67, 
                16,     // MIDI channel 0,
                62,
                127,
                01],	//

    sysExStartSpecific: [240, 
                        67, 
                        16,         // MIDI channel 0,
                        62,
                        13],		//

    // sysEx parameter change and parameter request
    parameterChange: function (arr, deviceSpecific) {
        return [240, 67, 16, 62, (deviceSpecific ? 13 : 127), 1].concat(arr, [247]); // Änderung für spezific
    },

    parameterRequest: function (arr, deviceSpecific) {
        return [240, 67, 48, 62, (deviceSpecific ? 13 : 127), 1].concat(arr, [247]);
    },

    // sysEx message types (7th byte)
    sysExElements: {
        channelPhase: 23,

        channelPair: 24,
        busPair: 39,
        auxPair: 52,

        channelInsert: 25,

        channelOn: 26,
        sumOn: 77,
        auxOn: 54,
        busOn: 41,

        channelPan: 27,
        busPan: 42,
        auxPan: 56,
        sumPan: 78,

        channelFader: 28,
        sumFader: 79,
        auxSendFader: 35,
        auxFader: 57,
        auxSendPan: 36,
        busFader: 43,

        channelEffect: {
            gate: 30,
            comp: 31,
            eq: 32,
            delay: 33
        },

        sumEffect: {
            comp: 81,
            eq: 82,
            delay: 83
        },

        auxEffect: {
            comp: 59,
            eq: 60,
            delay: 61
        },

        busEffect: {
            comp: 45,
            eq: 46,
            delay: 47
        },

        channelRouting: 34

    },


    // aux send: 8th byte is used for aux determination
    auxSendParam: function (aux) {
        return 3 * aux - 1;
    },

    // 10bit fader values are transmitted in 4 bytes
    // 00000000 00000000 00000nnn 0nnnnnnn
    value2Data: function (value) {
        var fill = 0;
        if (value < 0) {
            value = 2097152 + value;
            fill = 127;
        }
        return [fill, value >> 14, (value >> 7)& 0x7F, value & 0x7F];
    },

    data2Value: function (data) {
        value = (data[1] << 14) + (data[2] << 7) + data[3];
        if (data[0] == 127) { // test negative
            return (2097152 - value) * (-1);
        } else {
            return value;
        }    
    },

    // channel on values: last byte 1/0
    on2Data: function (on) {
        return [0, 0, 0, on ? 1 : 0];
    },

    data2On: function (data) {
        return !!data[3]; // type cast to boolean
    },

    // request meter levels
    // sent every 50msec
    // request has to be sent every 10sec
    remoteMeterRequest: [
        0xF0,
        0x43,
        0x30,
        0x3E,
        0x0D,
        0x21,		// Remote Meter
        0x00,	    // Address UL - faderpair to 0x22 / 34
        0x00,		// Address LU - up to 5
        0x00,		// Address LL - up to 0x27 / 39
        0,			// Count H
        32,			// Count L
        0xF7
    ],

    // interval for remote meter level transmission to the client
    // value*50msec
    remoteMeterInterval: 4,

    // request channel names
    // sent every 5000msec
    // request has to be sent every 10sec
    remoteFaderNameRequest: [
        0xF0,		// Start System Exclusive Message
        0x43,		// Manufacturers ID Number (Yamaha)
        0x30,		// 3n; n 0..15 MIDI Channel
        0x3E,		// Model ID (Digital Mixer
        0x0D,		// (01V96)
        0x02,		// Adress / Setup Data
        0x04,		// Element Number (ChannelName)
        0x04,		// Parameter Number (Character Count)
        0x00,		// Channel Number 
        0xF7		// End of System Exclusive Message
    ],

    remoteBusNameRequest: [
        0xF0,		// Start System Exclusive Message
        0x43,		// Manufacturers ID Number (Yamaha)
        0x30,		// 3n; n 0..15 MIDI Channel
        0x3E,		// Model ID (Digital Mixer
        0x0D,		// (01V96)
        0x02,		// Adress / Setup Data
        0x0F,		// Element Number (BusName)
        0x04,		// Parameter Number (Character Count)
        0x00,		// Channel Number 
        0xF7		// End of System Exclusive Message
    ],

    remoteAuxNameRequest: [
        0xF0,		// Start System Exclusive Message
        0x43,		// Manufacturers ID Number (Yamaha)
        0x30,		// 3n; n 0..15 MIDI Channel
        0x3E,		// Model ID (Digital Mixer
        0x0D,		// (01V96)
        0x02,		// Adress / Setup Data
        0x10,		// Element Number (auxName)
        0x04,		// Parameter Number (Character Count)
        0x00,		// Channel Number 
        0xF7		// End of System Exclusive Message
    ],

    remoteSumNameRequest: [
        0xF0,		// Start System Exclusive Message
        0x43,		// Manufacturers ID Number (Yamaha)
        0x30,		// 3n; n 0..15 MIDI Channel
        0x3E,		// Model ID (Digital Mixer
        0x0D,		// (01V96)
        0x02,		// Adress / Setup Data
        0x18,		// Element Number (sumName)
        0x04,		// Parameter Number (Character Count)
        0x00,		// Channel Number 
        0xF7		// End of System Exclusive Message
    ],

    // interval for remote meter level transmission to the client
    // value*50msec
    remoteNameInterval: 50000 
};


var status = {

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
var fillStatus = function () {
    var i, j;

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


/**
 * dispatch MIDI messages and execute server callback
 */
var deviceMessageHandler = function (message) {
    var outMessage = false,
        num, num2, value, i,

        messageBeginsWith = function (search) {
            var length = search.length,
                i;

            if (message.length < search.length) {
                return false;
            }

            for (i = 0; i < length; i++) {
                if (message[i] !== search[i]) {
                    return false;
                }
            }

            return true;
        },

        aboveThreshold = function (val1, val2) {
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
        messageCache.concat(message);
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

                    status.faderEffect['gate'][Object.keys(status.faderEffect['gate'])[message[7]]]['channel' + i] = value;

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
                    num = message[8] + 1;
                    value = config.data2Value(message.slice(9));
                    status.faderEffect['comp'][Object.keys(status.faderEffect['comp'])[message[7]]]['sum' + num] = value;

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
                    num = message[8] + 1;
                    value = config.data2Value(message.slice(9));

                    status.faderEffect['eq'][Object.keys(status.faderEffect['eq'])[message[7]]]['sum' + num] = value;

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
                    num = message[8] + 1;
                    value = config.data2Value(message.slice(9));

                    if (message[7] == 0) {
                        property = "On"
                    } else {
                        property = "Time"
                    }
                    status.faderEffect['delay'][property]['sum' + num] = value;

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
                    num = message[8] + 1;
                    value = config.data2Value(message.slice(9));

                    status.faderEffect['main']['Pan']['sum' + num] = value;

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
                    status.faderEffect['comp'][Object.keys(status.faderEffect['comp'])[message[7]]]['subusm' + num] = value;

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
                    num = message[8] + 1;
                    value = config.data2Value(message.slice(9));
                    status.faderPair['channel' + num] = value;

                    outMessage = {
                        type: 'faderPair',
                        target: "channel",
                        num: num,
                        prop: Object.keys(status.faderPair)[message[7]],
                        value: value
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
    if (messageBeginsWith(config.sysExStartSpecific) ) {
        // program change -> sync again
        if (message[5] == 16) {
            sendSyncRequest();
            return;
        // fader names
        }else if (message[5] == 02 && message[6] == 04) {
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
        } else if (message[5] == 02 && message[6] == 15) {
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
        } else if (message[5] == 02 && message[6] == 16) {
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
        } else if (message[5] == 02 && message[6] == 18) {
            faderNameCache += String.fromCharCode(message[12]) || ' ';
            if (message[7] - 4 == 15) {
                outMessage = {
                    type: "sumName",
                    target: "channel",
                    num: message[8] + 1,
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

/**
 * dispatch client messages and send the corresponding midi commands
 * @param {object} message
 * 		{
 *			type: fader / on / ... ,
 *			target: channel / aux / bus / sum
 *			num: {int}
 *			num2: {int} aux number for target auxsend
 *	 		value: {int} / {bool}
            param: parameter name in effect objects
 *		}
 * @param socket Client connection
 */
var clientMessageHandler = function (message, socket) {
    var i, j, groupId, pairNum, pairAux;

    // convert auxsend on to channel on
    if (message.type === 'on' && message.target === 'auxsend') {
        message.target = 'channel';
    }


    switch (message.type) {

        // control faders
        case "fader":

            switch (message.target) {
                case "channel":
                    setChannelFader(message.num, message.value);
                    break;

                case "auxsend":
                    setAuxSendFader(message.num2, message.num, message.value);
                    break;

                case "aux":
                    setAuxFader(message.num, message.value);
                    break;

                case "bus":
                    setBusFader(message.num, message.value);
                    break;

                case "sum":
                    setSumFader(message.value);
                    break;
            }

            break;

        // control On-buttons
        case "on":

            switch (message.target) {
                case "channel":
                case "auxsend":
                    setChannelOn(message.num, message.value);
                    break;

                case "aux":
                    setAuxOn(message.num, message.value);
                    break;

                case "bus":
                    setBusOn(message.num, message.value);
                    break;

                case "sum":
                    setSumOn(message.value);
                    break;
            }
            break;

        // set channel, aux, bus, sum names
        case "faderName":
            setName(message.target, message.num, message.value);
        break;

        // control effect settings
        case "faderEffect":
            if (message.target == "channel") {
                if (message.effect == "main") {
                    if( message.prop == "Pan") {
                        setFaderEffect(config.sysExElements.channelPan, 0, message.num, message.value);
                    } else if (message.prop == "Phase") {
                        setFaderEffect(config.sysExElements.channelPhase, 0, message.num, message.value);
                    } else {
                        setFaderEffect(config.sysExElements.channelRouting, parseInt(Object.keys(status.faderEffect[message.effect]).indexOf(message.prop) - 2), message.num, message.value);
                    } 
                } else {
                    setFaderEffect(config.sysExElements.channelEffect[message.effect], Object.keys(status.faderEffect[message.effect]).indexOf(message.prop), message.num, message.value);
                } 
            } else if (message.target == "sum"){
                if( message.prop == "Pan") {
                    setFaderEffect(config.sysExElements.sumPan, 0, message.num, message.value);
                } else if (message.effect == "delay") {
                    setFaderEffect(config.sysExElements.sumEffect[message.effect], ((message.prop == 'On') ? 0 : 1), message.num, message.value);
                } else {
                    setFaderEffect(config.sysExElements.sumEffect[message.effect], Object.keys(status.faderEffect[message.effect]).indexOf(message.prop), message.num, message.value); 
                }
            } else if (message.target == "bus"){
                if( message.prop == "Pan") {
                    setFaderEffect(config.sysExElements.busPan, 0, message.num, message.value);
                } else if (message.effect == "delay") {
                    setFaderEffect(config.sysExElements.busEffect[message.effect], ((message.prop == 'ON') ? 0 : 1), message.num, message.value);
                } else {
                    setFaderEffect(config.sysExElements.busEffect[message.effect], Object.keys(status.faderEffect[message.effect]).indexOf(message.prop), message.num, message.value); 
                }
            } else if (message.target == "aux"){
                if( message.prop == "Pan") {
                    setFaderEffect(config.sysExElements.auxPan, 0, message.num, message.value);
                } else if (message.effect == "delay") {
                    setFaderEffect(config.sysExElements.auxEffect[message.effect], ((message.prop == 'On') ? 0 : 1), message.num, message.value);
                } else {
                    setFaderEffect(config.sysExElements.auxEffect[message.effect], Object.keys(status.faderEffect[message.effect]).indexOf(message.prop), message.num, message.value); 
                }
            }
            status.faderEffect[message.effect][message.prop][message.target + message.num] = message.value;

            break;

        case "syncEffect":

            sendCannelEffectRequest(message.num, message.target);

            break;
        
        case "sync":

            app.controllers.socket.send(socket, {
                type: 'sync',
                status: status
            });

            break;
    }

    // broadcast to other clients
    if (message.type === 'fader' || message.type === 'on') {
        app.controllers.socket.broadcastToOthers(socket, message);

        // apply to all channels of group or a pair

        if (message.target === 'channel' || message.target === 'auxsend' || message.target === 'aux' || message.target === 'bus') {
            // pairing partner has to be transferred
            if(status.faderPair && status.faderPair[message.target + message.num] == 1) {
                if (message.num % 2){
					pairNum = parseInt(message.num) + 1;
				} else {
					pairNum = parseInt(message.num) - 1;
				}
                // pairing of channels inside of a tab
                app.controllers.socket.broadcastToOthers(socket, {
                    type: message.type,
                    target: message.target,
                    num: pairNum,
                    num2: message.num2,
                    value: message.value
                });
                // pairing of channels in paired aux tabs
                if(message.target === 'auxsend'){
                    if (message.num % 2){
                        pairNum = parseInt(message.num) + 1;
                    } else {
                        pairNum = parseInt(message.num) - 1;
                    }
                    app.controllers.socket.broadcastToOthers(socket, {
                        type: message.type,
                        target: message.target,
                        num: pairNum,
                        num2: message.num2 + pairAux,
                        value: message.value
                    });
                    app.controllers.socket.broadcastToOthers(socket, {
                        type: message.type,
                        target: message.target,
                        num: message.num,
                        num2: message.num2 + pairAux,
                        value: message.value
                    });
                }
            }
            
            i = app.clientConfig.groups.length;

            while (i--) {
                if (app.clientConfig.groups[i].indexOf(message.num) !== -1) {
                    j = app.clientConfig.groups[i].length;

                    while (j--) {
                        groupId = app.clientConfig.groups[i][j];

                        if (groupId !== message.num) {
                            if (message.type === 'fader') {
                                status.fader[message.target + (message.num2 || '') + groupId] = message.value;
                            }
                            else {
                                status.on['channel' + groupId] = message.value;
                            }

                            // broadcast group changes to other clients
                            app.controllers.socket.broadcastToOthers(socket, {
                                type: message.type,
                                target: message.target,
                                num: groupId,
                                num2: message.num2,
                                value: message.value
                            });
                        }
                    }

                    break;
                }
            }
        }
    }
};


/*
 * message send functions
 */

var setChannelFader = function (channel, value) {
    if (channel < 1 || channel > config.channelCount) {
        console.log('[mixer] Invalid channel number ' + channel + ' (fader)');
        return;
    }

    device.send(
        config.parameterChange(
            [config.sysExElements.channelFader, 0, channel - 1].concat(config.value2Data(value))
        )
    );

    status.fader['channel' + channel] = value;
};

var setChannelOn = function (channel, on) {
    if (channel < 1 || channel > config.channelCount) {
        console.log('[mixer] Invalid channel number ' + channel + ' (on)');
        return;
    }

    device.send(
        config.parameterChange(
            [config.sysExElements.channelOn, 0, channel - 1].concat(config.on2Data(on))
        )
    );

    status.on['channel' + channel] = on;
};

//  set parameter for property [Gate, Comp, EQ, Delay, Pair] of channel 
var setFaderEffect = function (effect, property, channel, parameter) {
    if (channel < 1 || channel > config.channelCount) {
        console.log('[mixer] Invalid channel number ' + channel + ' (on)');
        return;
    }

    device.send(
        config.parameterChange(
            [effect, property, channel - 1].concat(config.value2Data(parameter))
        )

    )
};

//  set names for channel, aux, bus, sum 
var setName = function (property, number, name) {
    for (i=0; i < name.length; i++) {
        if ( property == 'channel') {
            device.send([0xF0,0x43,0x10,0x3E,0x0D,0x02,0x04].concat(i + 4).concat(number - 1).concat(config.value2Data(name.charCodeAt(i)),[247]))
        } else if ( property == 'bus') {
            device.send([0xF0,0x43,0x10,0x3E,0x0D,0x02,0x0F].concat(i + 4).concat(number - 1).concat(config.value2Data(name.charCodeAt(i)),[247]))
        } else if ( property == 'aux') {
            device.send([0xF0,0x43,0x10,0x3E,0x0D,0x02,0x10].concat(i + 4).concat(number - 1).concat(config.value2Data(name.charCodeAt(i)),[247]))
        } else if ( property == 'sum') {
            device.send([0xF0,0x43,0x10,0x3E,0x0D,0x02,0x08].concat(i + 4).concat(number - 1).concat(config.value2Data(name.charCodeAt(i)),[247]))
        } else {
            console.log('[mixer] Invalid name type ' + property);
        }
    }
};

var setSumFader = function (value) {
    device.send(
        config.parameterChange(
            [config.sysExElements.sumFader, 0, 0].concat(config.value2Data(value))
        )
    );

    status.fader['sum0'] = value;
};

var setSumOn = function (on) {
    device.send(
        config.parameterChange(
            [config.sysExElements.sumOn, 0, 0].concat(config.on2Data(on))
        )
    );

    status.on['sum0'] = on;
};

var setAuxSendFader = function (aux, channel, value) {
    if (aux < 1 || aux > config.auxSendCount) {
        console.log('[mixer] Invalid aux send number ' + aux);
        return;
    }

    if (channel < 1 || channel > config.channelCount) {
        console.log('[mixer] Invalid aux send channel number ' + channel);
        return;
    }

    device.send(
        config.parameterChange(
            [config.sysExElements.auxSendFader, config.auxSendParam(aux), channel - 1].concat(config.value2Data(value))
        )
    );

    status.fader['auxsend' + aux + channel] = value;
};

var setAuxFader = function (aux, value) {
    if (aux < 1 || aux > config.auxCount) {
        console.log('[mixer] Invalid aux number ' + aux + ' (fader)');
        return;
    }

    device.send(
        config.parameterChange(
            [config.sysExElements.auxFader, 0, aux - 1].concat(config.value2Data(value))
        )
    );

    status.fader['aux' + aux] = value;
};

var setAuxOn = function (aux, on) {
    if (aux < 1 || aux > config.auxCount) {
        console.log('[mixer] Invalid aux number ' + aux + ' (on)');
        return;
    }

    device.send(
        config.parameterChange(
            [config.sysExElements.auxOn, 0, aux - 1].concat(config.on2Data(on))
        )
    );

    status.on['aux' + aux] = on;
};

var setBusFader = function (bus, value) {
    if (bus < 1 || bus > config.busCount) {
        console.log('[mixer] Invalid bus number ' + bus + ' (fader)');
        return;
    }

    device.send(
        config.parameterChange(
            [config.sysExElements.busFader, 0, bus - 1].concat(config.value2Data(value))
        )
    );

    status.fader['bus' + bus] = value;
};

var setBusOn = function (bus, on) {
    if (bus < 1 || bus > config.busCount) {
        console.log('[mixer] Invalid bus number ' + bus + ' (on)');
        return;
    }

    device.send(
        config.parameterChange(
            [config.sysExElements.busOn, 0, bus - 1].concat(config.on2Data(on))
        )
    );

    status.on['bus' + bus] = on;
};

/*
 * Parameter requests
 */

var sendRemoteMeterRequest = function () {
    // effect meter request
    config.remoteMeterRequest[7] = 0;
    // iterate through channel, aux, bus
    for(i = 0; i < 3; i++) {
        config.remoteMeterRequest[6] = i;
        device.send(config.remoteMeterRequest);
    }
    // select sum
    config.remoteMeterRequest[6] = 4;
    device.send(config.remoteMeterRequest);
    // reset for iteration
    config.remoteMeterRequest[6] = 0;
};

var sendFaderNameRequest = function () {
    while (true) {
        device.send(config.remoteFaderNameRequest);
            // character count
            config.remoteFaderNameRequest[7]++;
            if (config.remoteFaderNameRequest[7] > 0x13) {
                config.remoteFaderNameRequest[7] = 0x04;

                // channel number
                config.remoteFaderNameRequest[8]++;
                if (config.remoteFaderNameRequest[8] > 0x1F) {
                    config.remoteFaderNameRequest[8] = 0x00;
                    return
                }
            }
    } 
    
};

var sendAuxNameRequest = function () {
    while (true) {
        device.send(config.remoteAuxNameRequest);

        // character count
        config.remoteAuxNameRequest[7]++;
        if (config.remoteAuxNameRequest[7] > 0x13) {
            config.remoteAuxNameRequest[7] = 0x04;

            // aux number
            config.remoteAuxNameRequest[8]++;
            if (config.remoteAuxNameRequest[8] > 0x07) {
                config.remoteAuxNameRequest[8] = 0x00;
                return
            }
        }
    }
};

var sendBusNameRequest = function () {
    while (true) {
        device.send(config.remoteBusNameRequest);

        // character count
        config.remoteBusNameRequest[7]++;
        if (config.remoteBusNameRequest[7] > 0x13) {
            config.remoteBusNameRequest[7] = 0x04;

            // bus number
            config.remoteBusNameRequest[8]++;
            if (config.remoteBusNameRequest[8] > 0x07) {
                config.remoteBusNameRequest[8] = 0x00;
                return
            }
        }
    }
};

var sendSumNameRequest = function () {
    while (true) {
        device.send(config.remoteSumNameRequest);

        // character count
        config.remoteSumNameRequest[7]++;
        if (config.remoteSumNameRequest[7] > 0x13) {
            config.remoteSumNameRequest[7] = 0x04;

            // sum number
            config.remoteSumNameRequest[8]++;
            if (config.remoteSumNameRequest[8] > 0x01) {
                config.remoteSumNameRequest[8] = 0x00;
                return
            }
        }
    }
};

var sendCannelEffectRequest = function (channel, type) {

    // channelEffect: request for all parameters of a channel
    if (type == 'channel') {
        for (x in status.faderEffect) {
            for (j = 0; j < Object.keys(status.faderEffect[x]).length; j++) {
                device.send(
                    config.parameterRequest([config.sysExElements.channelEffect[x], j, channel - 1])
                )
            };
        }
    } else if (type == 'bus') {
        for (x of ['comp', 'eq', 'delay']) {
            for (j = 0; j < Object.keys(status.faderEffect[x]).length; j++) {
                device.send(
                    config.parameterRequest([config.sysExElements.busEffect[x], j, channel - 1])
                )
            };
        }
        device.send(config.parameterRequest([config.sysExElements.busPan, 0, channel - 1]))

    } else if (type == 'aux') {
        for (x of ['comp', 'eq', 'delay']) {
            for (j = 0; j < Object.keys(status.faderEffect[x]).length; j++) {
                device.send(
                    config.parameterRequest([config.sysExElements.auxEffect[x], j, channel - 1])
                )
            };
        }
        device.send(config.parameterRequest([config.sysExElements.auxPan, 0, channel - 1]))

    } else if (type == 'sum') {
        for (x of ['comp', 'eq', 'delay']) {
            for (j = 0; j < Object.keys(status.faderEffect[x]).length; j++) {
                device.send(
                    config.parameterRequest([config.sysExElements.sumEffect[x], j, channel - 1])
                )
            };
        }
        device.send(config.parameterRequest([config.sysExElements.sumPan, 0, channel - 1]))
    }
    
};

var sendSyncRequest = function () {
    var i, j, limit, auxSendParam;
    for (i in config.sysExElements) {
        if (config.sysExElements.hasOwnProperty(i)) {

            // multiple parameter per channel sends are handled later
            if (i.indexOf('auxSend') === 0 || i.indexOf('channelGate') === 0 || i.indexOf('channelComp') === 0 || i.indexOf('channelEQ') === 0 || i.indexOf('channelDelay') === 0) {
                continue;
            }

            // single parameter per channel
            if (i.indexOf('channel') === 0) {
                limit = config.channelCount;
            }
            else if (i.indexOf('aux') === 0) {
                limit = config.auxCount;
            }
            else if (i.indexOf('bus') === 0) {
                limit = config.busCount;
            }
            else {
                limit = 1;
            }

            for (j = 0; j < limit; j++) {
                device.send(
                    config.parameterRequest(
                        [config.sysExElements[i], 0, j]
                    )
                );
            }

        }
    }

    // multiple parameter per channel
    // aux send: requests for all channels for all aux
    for (i = 1; i <= config.auxSendCount; i++) {
        auxSendParam = config.auxSendParam(i);

        for (j = 0; j < config.channelCount; j++) {
            device.send(
                config.parameterRequest(
                    [config.sysExElements.auxSendFader, auxSendParam, j]
                )
            );
        }
    };

    // aux send: request for pan of all aux channels
    for (i = 0; i < config.auxSendCount/2; i++) {
        for (j = 0; j < config.channelCount; j++) {
            device.send(
                config.parameterRequest(
                    [config.sysExElements.auxSendPan, i  , j]
                )
            );
        }
    };

};


module.exports = function (globalApp) {

    app = globalApp;
    app.events.on('ready', init);

};
