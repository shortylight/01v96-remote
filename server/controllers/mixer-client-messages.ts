import type { Application } from "../types";
import type { MixerConfig, MixerStatus } from "./mixer-types";
import type { createMixerCommands } from "./mixer-commands";

export function createClientMessageHandler(
    app: Application,
    config: MixerConfig,
    status: MixerStatus,
    commands: ReturnType<typeof createMixerCommands>,
    sendChannelEffectRequest: (channel: number, type: string) => void,
    sendChannelPanRequest: (channel: number) => void
) {
    const { setChannelFader, setChannelOn, setFaderEffect, setName, setSumFader, setSumOn, setAuxSendFader, setAuxFader, setAuxOn, setBusFader, setBusOn } = commands;
    const pairedChannel = function(channel: number) {
        const partner = channel % 2 ? channel + 1 : channel - 1;
        return partner <= config.channelCount &&
            (status.faderPair["channel" + channel] == 1 ||
                status.faderPair["channel" + partner] == 1) ?
            partner : 0;
    };

    return function clientMessageHandler(message: any, socket: any) {
        let i, j, groupId, pairNum, pairAux;

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
            case "faderEffect": {
                const effectValues = typeof message.effect === "string" ?
                    status.faderEffect[message.effect] : undefined;
                const propertyValues = effectValues && typeof message.prop === "string" ?
                    effectValues[message.prop] : undefined;
                const targetLimit = message.target === "channel" ? config.channelCount :
                    message.target === "bus" ? config.busCount :
                    message.target === "aux" ? config.auxCount :
                    message.target === "sum" ? 0 : undefined;
                let effectElement: number | undefined;

                if (message.target === "channel" && message.effect === "main") {
                    effectElement = message.prop === "Pan" ? config.sysExElements.channelPan :
                        message.prop === "Phase" ? config.sysExElements.channelPhase :
                        config.sysExElements.channelRouting;
                } else if (message.target === "channel" && message.effect === "eq" && message.prop === "Att") {
                    effectElement = config.sysExElements.channelAttenuator;
                } else if (message.target === "channel") {
                    effectElement = config.sysExElements.channelEffect[message.effect];
                } else if (message.target === "sum") {
                    effectElement = message.prop === "Pan" ? config.sysExElements.sumPan :
                        config.sysExElements.sumEffect[message.effect];
                } else if (message.target === "bus") {
                    effectElement = message.prop === "Pan" ? config.sysExElements.busPan :
                        config.sysExElements.busEffect[message.effect];
                } else if (message.target === "aux") {
                    effectElement = message.prop === "Pan" ? config.sysExElements.auxPan :
                        config.sysExElements.auxEffect[message.effect];
                }

                if (
                    targetLimit === undefined ||
                    !Number.isInteger(message.num) ||
                    message.num < (message.target === "sum" ? 0 : 1) ||
                    message.num > targetLimit ||
                    !effectValues ||
                    !propertyValues ||
                    typeof propertyValues !== "object" ||
                    effectElement === undefined ||
                    (message.effect === "eq" && message.prop === "Att" && message.target !== "channel") ||
                    (typeof message.value !== "number" && typeof message.value !== "boolean") ||
                    (typeof message.value === "number" && !Number.isFinite(message.value))
                ) {
                    console.log("[mixer] Ignoring invalid faderEffect message:", {
                        target: message.target,
                        num: message.num,
                        effect: message.effect,
                        prop: message.prop,
                        value: message.value
                    });
                    break;
                }

                if (message.target == "channel") {
                    if (message.effect == "main") {
                        if( message.prop == "Pan") {
                            setFaderEffect(config.sysExElements.channelPan, 0, message.num, message.value);
                        } else if (message.prop == "Phase") {
                            setFaderEffect(config.sysExElements.channelPhase, 0, message.num, message.value);
                        } else {
                            setFaderEffect(config.sysExElements.channelRouting, Number(Object.keys(status.faderEffect[message.effect]).indexOf(message.prop) - 2), message.num, message.value);
                        }
                    } else if (message.effect === "eq" && message.prop === "Att") {
                        setFaderEffect(config.sysExElements.channelAttenuator, 0, message.num, message.value);
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
            }

            case "syncEffect":

                sendChannelEffectRequest(message.num, message.target);

                break;

            case "syncPan": {
                if (!Number.isInteger(message.num) || message.num < 1 || message.num > config.channelCount) {
                    console.log("[mixer] Invalid channel number " + message.num + " (pan sync)");
                    break;
                }

                sendChannelPanRequest(message.num);
                const panPartner = message.num % 2 ? message.num + 1 : message.num - 1;
                if (panPartner <= config.channelCount) sendChannelPanRequest(panPartner);
                break;
            }

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
                pairNum = message.target === 'channel' ?
                    pairedChannel(Number(message.num)) : 0;
                if (pairNum || (message.target !== 'channel' &&
                    status.faderPair && status.faderPair[message.target + message.num] == 1)) {
                    if (!pairNum) {
                        if (message.num % 2){
                            pairNum = parseInt(message.num) + 1;
                        } else {
                            pairNum = parseInt(message.num) - 1;
                        }
                    }
                    if (message.target === 'channel') {
                        if (message.type === 'fader') {
                            status.fader['channel' + pairNum] = message.value;
                        } else {
                            status.on['channel' + pairNum] = message.value;
                        }
                    }
                    // Keep the initiating client and other clients in sync.
                    const pairedMessage = {
                        type: message.type,
                        target: message.target,
                        num: pairNum,
                        num2: message.num2,
                        value: message.value
                    };
                    app.controllers.socket.send(socket, pairedMessage);
                    app.controllers.socket.broadcastToOthers(socket, pairedMessage);
                    // pairing of channels in paired aux tabs
                    if(message.target === 'auxsend'){
                        pairAux = message.num2 % 2 ? 1 : -1;
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
    };
