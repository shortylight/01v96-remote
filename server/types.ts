export interface ClientConfig {
    names: Record<string, string>;
    groups: number[][];
}

export interface Application {
    config: {
        staticPort: number;
        channelStripPort: number;
        webSocketPort: number;
    };
    clientConfig: ClientConfig;
    events: {
        is(events: string | string[]): boolean;
        on(events: string | string[], listener: () => void): void;
        fire(event: string): void;
    };
    controllers: Record<string, any>;
}
