import type { Application } from "../types";

const websocket = require('ws');
let app: Application;
const connections: any[] = [];
const listeners: Array<(message: any, socket: any) => void> = [];

function parseJson(message: string | Buffer) {
    try {
        return JSON.parse(message.toString());
    }
    catch(e) {
        console.log('[socket] Invalid JSON message received:', message);
        console.log(e);
        return undefined;
    }
}

const init = function() {

    // create web socket server
    const wsServer = new websocket.Server({
        port: app.config.webSocketPort
    });

    wsServer.on('connection', function(connection: any) {

        connections.push(connection);

        console.log('[socket] Client connected');


        // message handling

        connection.on('message', function(message: string | Buffer) {
            let i = listeners.length;
            const obj = parseJson(message);

            if(obj === undefined) return;

            while(i--) {
                listeners[i](obj, connection);
            }

        });

        // socket closed: remove client from connection pool

        connection.on('close', function() {
            console.log('[socket] Closed connection');

            const index = connections.indexOf(connection);

            if(index !== -1) {
                connections.splice(index,1);
            }
        });

    });

    console.log('[socket] WebSocket server started at port ' + app.config.webSocketPort);

};

const send = function(socket: any, message: any) {
    let content = message;

    if(typeof(message) !== 'string') {
        content = JSON.stringify(message);
    }

    try {
        socket.send(content);
    } catch {
        // do nothing
    }
};

/**
 * Broadcast message to all connected clients
 * @param {string | object} message Objects are converted to JSON string
 */
const broadcast = function(message: any) {
    let i = connections.length,
        content = message;

    if(typeof(message) !== 'string') {
        content = JSON.stringify(message);
    }

    while(i--) {
        try {
            connections[i].send(content);
        } catch {
            // do nothing
        }
    }
};

/**
 * Broadcast message to all clients except one
 * @param socket has to be contained in the connections array
 * @param {string | object} message Objects are converted to JSON string
 */
const broadcastToOthers = function(socket: any, message: any) {
    let i = connections.length,
        content = message;

    if(typeof(message) !== 'string') {
        content = JSON.stringify(message);
    }

    while(i--) {
        if(connections[i] !== socket) {
            try {
                connections[i].send(content);
            } catch {
                // do nothing
            }
        }
    }
};

/**
 * Add WebSocket message listener
 * @param listener
 */
const addListener = function(listener: (message: any, socket: any) => void) {
    listeners.push(listener);
};



export {};

module.exports = function(globalApp: Application) {

    app = globalApp;

    app.events.on('ready', init);

    return {
        send: send,
        broadcast: broadcast,
        broadcastToOthers: broadcastToOthers,
        addListener: addListener
    };

};
