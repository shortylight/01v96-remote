import type { MixerConfig, MixerDevice, MixerStatus } from "./mixer-types";

export function createMixerCommands(config: MixerConfig, status: MixerStatus, device: MixerDevice) {
    /*
     * message send functions
     */

    const setChannelFader = function (channel: number, value: number) {
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

    const setChannelOn = function (channel: number, on: boolean) {
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
    const setFaderEffect = function (effect: number, property: number, channel: number, parameter: number) {
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
    const setName = function (property: string, number: number, name: string) {
        let i;
        for (i=0; i < name.length; i++) {
            if ( property == 'channel') {
                device.send([0xF0,0x43,0x10,0x3E,0x0D,0x02,0x04].concat(i + 4).concat(number - 1).concat(config.value2Data(name.charCodeAt(i)),[247]))
            } else if ( property == 'bus') {
                device.send([0xF0,0x43,0x10,0x3E,0x0D,0x02,0x0F].concat(i + 4).concat(number - 1).concat(config.value2Data(name.charCodeAt(i)),[247]))
            } else if ( property == 'aux') {
                device.send([0xF0,0x43,0x10,0x3E,0x0D,0x02,0x10].concat(i + 4).concat(number - 1).concat(config.value2Data(name.charCodeAt(i)),[247]))
            } else if ( property == 'sum') {
                device.send([0xF0,0x43,0x10,0x3E,0x0D,0x02,0x12].concat(i + 4).concat(number).concat(config.value2Data(name.charCodeAt(i)),[247]))
            } else {
                console.log('[mixer] Invalid name type ' + property);
            }
        }
    };

    const setSumFader = function (value: number) {
        device.send(
            config.parameterChange(
                [config.sysExElements.sumFader, 0, 0].concat(config.value2Data(value))
            )
        );

        status.fader['sum0'] = value;
    };

    const setSumOn = function (on: boolean) {
        device.send(
            config.parameterChange(
                [config.sysExElements.sumOn, 0, 0].concat(config.on2Data(on))
            )
        );

        status.on['sum0'] = on;
    };

    const setAuxSendFader = function (aux: number, channel: number, value: number) {
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

    const setAuxFader = function (aux: number, value: number) {
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

    const setAuxOn = function (aux: number, on: boolean) {
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

    const setBusFader = function (bus: number, value: number) {
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

    const setBusOn = function (bus: number, on: boolean) {
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

        return { setChannelFader, setChannelOn, setFaderEffect, setName, setSumFader, setSumOn, setAuxSendFader, setAuxFader, setAuxOn, setBusFader, setBusOn };
}
