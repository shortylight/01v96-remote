export interface MixerDevice {
    setListener(listener: (message: number[]) => void): void;
    send(message: number[]): void;
}

export interface MixerStatus {
    on: Record<string, boolean>;
    fader: Record<string, number>;
    faderName: Record<string, string>;
    faderEffect: Record<string, Record<string, Record<string, number | boolean>>>;
    faderPair: Record<string, number>;
}

export interface MixerConfig {
    channelCount: number;
    auxCount: number;
    auxSendCount: number;
    busCount: number;
    faderThreshold: number;
    sysExStart: number[];
    sysExStartSpecific: number[];
    parameterChange(arr: number[], deviceSpecific?: boolean): number[];
    parameterRequest(arr: number[], deviceSpecific?: boolean): number[];
    sysExElements: Record<string, any>;
    auxSendParam(aux: number): number;
    value2Data(value: number): number[];
    data2Value(data: number[]): number;
    on2Data(on: boolean): number[];
    data2On(data: number[]): boolean;
    remoteMeterRequest: number[];
    remoteFaderNameRequest: number[];
    remoteBusNameRequest: number[];
    remoteAuxNameRequest: number[];
    remoteSumNameRequest: number[];
    remoteMeterInterval: number;
    remoteNameInterval: number;
}
