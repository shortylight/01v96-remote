import type { MixerConfig, MixerDevice, MixerStatus } from "./mixer-types";

export function createMixerRequests(config: MixerConfig, status: MixerStatus, device: MixerDevice) {
    let faderNameRequestTimer: NodeJS.Timeout | undefined;

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
        let x, j;

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

    const sendSyncRequest = function () {
        let i, j, limit, auxSendParam;
        for (i in config.sysExElements) {
            if (Object.prototype.hasOwnProperty.call(config.sysExElements, i)) {

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

        return { sendRemoteMeterRequest, sendFaderNameRequest, sendAuxNameRequest, sendBusNameRequest, sendSumNameRequest, sendChannelEffectRequest, sendSyncRequest };
}
