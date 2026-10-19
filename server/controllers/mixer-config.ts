import type { MixerConfig } from "./mixer-types";

/**
 * device-specific configuration
 */
export const config: MixerConfig = {

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
                1],	//

    sysExStartSpecific: [240,
                        67,
                        16,         // MIDI channel 0,
                        62,
                        13],		//

    // sysEx parameter change and parameter request
    parameterChange: function (arr: number[], deviceSpecific = false) {
        return [240, 67, 16, 62, (deviceSpecific ? 13 : 127), 1].concat(arr, [247]); // Änderung für spezific
    },

    parameterRequest: function (arr: number[], deviceSpecific = false) {
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
    auxSendParam: function (aux: number) {
        return 3 * aux - 1;
    },

    // 10bit fader values are transmitted in 4 bytes
    // 00000000 00000000 00000nnn 0nnnnnnn
    value2Data: function (value: number) {
        let fill = 0;
        if (value < 0) {
            value = 2097152 + value;
            fill = 127;
        }
        return [fill, value >> 14, (value >> 7)& 0x7F, value & 0x7F];
    },

    data2Value: function (data: number[]) {
        const value = (data[1] << 14) + (data[2] << 7) + data[3];
        if (data[0] == 127) { // test negative
            return (2097152 - value) * (-1);
        } else {
            return value;
        }
    },

    // channel on values: last byte 1/0
    on2Data: function (on: boolean) {
        return [0, 0, 0, on ? 1 : 0];
    },

    data2On: function (data: number[]) {
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
        0x12,		// Element Number (sumName)
        0x04,		// Parameter Number (Character Count)
        0x00,		// Channel Number
        0xF7		// End of System Exclusive Message
    ],

    // interval for remote meter level transmission to the client
    // value*50msec
    remoteNameInterval: 50000
};
