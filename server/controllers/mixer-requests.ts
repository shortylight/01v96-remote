import type { MixerConfig, MixerDevice, MixerStatus } from "./mixer-types";

export function createMixerRequests(config: MixerConfig, status: MixerStatus, device: MixerDevice) {
    let faderNameRequestTimer: NodeJS.Timeout | undefined;
    let syncRequestTimer: NodeJS.Timeout | undefined;

    const sendRemoteMeterRequest = function () {
        let i;
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

    const sendFaderNameRequest = function () {
        if (faderNameRequestTimer) {
            clearTimeout(faderNameRequestTimer);
        }

        let character = 0x04;
        let channel = 0;
        const sendNextRequest = function () {
            const request = config.remoteFaderNameRequest.slice();
            request[7] = character;
            request[8] = channel;
            device.send(request);

            character++;
            if (character > 0x13) {
                character = 0x04;
                channel++;
            }

            if (channel <= 0x1F) {
                faderNameRequestTimer = setTimeout(sendNextRequest, 10);
            } else {
                faderNameRequestTimer = undefined;
            }
        };

        sendNextRequest();
    };

    const sendAuxNameRequest = function () {
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

    const sendBusNameRequest = function () {
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

    const sendSumNameRequest = function () {
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

    const sendChannelEffectRequest = function (channel: number, type: string) {
        let x: string, j;

        // channelEffect: request for all parameters of a channel
        if (type == 'channel') {
            for (x in status.faderEffect) {
                const properties = Object.keys(status.faderEffect[x]).filter(
                    property => x !== 'eq' || property !== 'Att'
                );
                for (j = 0; j < properties.length; j++) {
                    device.send(
                        config.parameterRequest([config.sysExElements.channelEffect[x], j, channel - 1])
                    )
                };
            }
            device.send(config.parameterRequest([config.sysExElements.channelAttenuator, 0, channel - 1]));
        } else if (type == 'bus') {
            for (x of ['comp', 'eq', 'delay']) {
                const properties = Object.keys(status.faderEffect[x]).filter(property => property !== 'Att');
                for (j = 0; j < properties.length; j++) {
                    device.send(
                        config.parameterRequest([config.sysExElements.busEffect[x], j, channel - 1])
                    )
                };
            }
            device.send(config.parameterRequest([config.sysExElements.busPan, 0, channel - 1]))

        } else if (type == 'aux') {
            for (x of ['comp', 'eq', 'delay']) {
                const properties = Object.keys(status.faderEffect[x]).filter(property => property !== 'Att');
                for (j = 0; j < properties.length; j++) {
                    device.send(
                        config.parameterRequest([config.sysExElements.auxEffect[x], j, channel - 1])
                    )
                };
            }
            device.send(config.parameterRequest([config.sysExElements.auxPan, 0, channel - 1]))

        } else if (type == 'sum') {
            for (x of ['comp', 'eq', 'delay']) {
                const properties = Object.keys(status.faderEffect[x]).filter(property => property !== 'Att');
                for (j = 0; j < properties.length; j++) {
                    device.send(
                        config.parameterRequest([config.sysExElements.sumEffect[x], j, channel - 1])
                    )
                };
            }
            device.send(config.parameterRequest([config.sysExElements.sumPan, 0, channel - 1]))
        }

    };

    const sendChannelPanRequest = function (channel: number) {
        device.send(config.parameterRequest([config.sysExElements.channelPan, 0, channel - 1]));
    };

    const sendSyncRequest = function () {
        const pendingRequests: number[][] = [];
        const addRequests = function(element: number, parameterCount: number, channelCount: number) {
            let channel, parameter;
            for (channel = 0; channel < channelCount; channel++) {
                for (parameter = 0; parameter < parameterCount; parameter++) {
                    pendingRequests.push(config.parameterRequest([element, parameter, channel]));
                }
            }
        };
        const addEffectRequests = function(
            elements: Record<string, number>,
            effects: string[],
            channelCount: number,
            excludeAttenuator: boolean,
            outputDelayParameterCount?: number
        ) {
            let effect, parameterCount;
            for (effect of effects) {
                parameterCount = Object.keys(status.faderEffect[effect]).filter(
                    property => !excludeAttenuator || property !== 'Att'
                ).length;
                if (effect === 'delay' && outputDelayParameterCount !== undefined) {
                    parameterCount = outputDelayParameterCount;
                }
                addRequests(elements[effect], parameterCount, channelCount);
            }
        };
        let channel, aux, parameter, auxSend, nextRequestIndex = 0;

        if (syncRequestTimer) {
            clearTimeout(syncRequestTimer);
        }

        for (const element of [
            config.sysExElements.channelPhase,
            config.sysExElements.channelPair,
            config.sysExElements.channelOn,
            config.sysExElements.channelPan,
            config.sysExElements.channelAttenuator,
            config.sysExElements.channelFader
        ]) {
            addRequests(element, 1, config.channelCount);
        }

        addRequests(
            config.sysExElements.channelRouting,
            Object.keys(status.faderEffect.main).length - 2,
            config.channelCount
        );
        addEffectRequests(config.sysExElements.channelEffect, ['gate', 'comp', 'eq', 'delay'], config.channelCount, true);

        for (const element of [
            config.sysExElements.auxOn,
            config.sysExElements.auxPan,
            config.sysExElements.auxFader,
            config.sysExElements.auxPair
        ]) {
            addRequests(element, 1, config.auxCount);
        }
        addEffectRequests(config.sysExElements.auxEffect, ['comp', 'eq', 'delay'], config.auxCount, true, 2);

        for (const element of [
            config.sysExElements.busOn,
            config.sysExElements.busPan,
            config.sysExElements.busFader,
            config.sysExElements.busPair
        ]) {
            addRequests(element, 1, config.busCount);
        }
        addEffectRequests(config.sysExElements.busEffect, ['comp', 'eq', 'delay'], config.busCount, true, 2);

        addRequests(config.sysExElements.sumOn, 1, 1);
        addRequests(config.sysExElements.sumPan, 1, 1);
        addRequests(config.sysExElements.sumFader, 1, 1);
        addEffectRequests(config.sysExElements.sumEffect, ['comp', 'eq', 'delay'], 1, true, 2);

        for (auxSend = 1; auxSend <= config.auxSendCount; auxSend++) {
            parameter = config.auxSendParam(auxSend);
            for (channel = 0; channel < config.channelCount; channel++) {
                pendingRequests.push(
                    config.parameterRequest([config.sysExElements.auxSendFader, parameter, channel])
                );
            }
        }

        for (aux = 0; aux < config.auxSendCount / 2; aux++) {
            for (channel = 0; channel < config.channelCount; channel++) {
                pendingRequests.push(
                    config.parameterRequest([config.sysExElements.auxSendPan, aux, channel])
                );
            }
        }

        const sendNextRequest = function() {
            const nextRequest = pendingRequests[nextRequestIndex++];
            if (!nextRequest) {
                syncRequestTimer = undefined;
                return;
            }
            device.send(nextRequest);
            syncRequestTimer = setTimeout(sendNextRequest, 5);
        };

        sendNextRequest();

    };

        return { sendRemoteMeterRequest, sendFaderNameRequest, sendAuxNameRequest, sendBusNameRequest, sendSumNameRequest, sendChannelEffectRequest, sendChannelPanRequest, sendSyncRequest };
}
