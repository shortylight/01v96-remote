import type { Application } from "../types";
import type { MixerConfig, MixerStatus } from "./mixer-types";
import type { createMixerCommands } from "./mixer-commands";

export function createClientMessageHandler(
    app: Application,
    config: MixerConfig,
    status: MixerStatus,
    commands: ReturnType<typeof createMixerCommands>,
    sendChannelEffectRequest: (channel: number, type: string) => void
) {
    const { setChannelFader, setChannelOn, setFaderEffect, setName, setSumFader, setSumOn, setAuxSendFader, setAuxFader, setAuxOn, setBusFader, setBusOn } = commands;

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
            case "faderEffect":
                if (message.target == "channel") {
                    if (message.effect == "main") {
                        if( message.prop == "Pan") {
                            setFaderEffect(config.sysExElements.channelPan, 0, message.num, message.value);
                        } else if (message.prop == "Phase") {
                            setFaderEffect(config.sysExElements.channelPhase, 0, message.num, message.value);
                        } else {
                            setFaderEffect(config.sysExElements.channelRouting, Number(Object.keys(status.faderEffect[message.effect]).indexOf(message.prop) - 2), message.num, message.value);
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

                sendChannelEffectRequest(message.num, message.target);

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
