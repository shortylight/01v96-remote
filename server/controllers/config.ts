import * as fs from "node:fs";
import * as path from "node:path";
import type { Application } from "../types";

let app: Application;

const configPath = path.resolve(__dirname, '../../../config/client.js');


const init = function() {

    fs.readFile(configPath, function(err, data) {
        if(err) {
            console.log('[config] config/client.js does not yet exist');
            return;
        }

        console.log('[config] Loading config/client.js');

        try {
            app.clientConfig = JSON.parse(data.toString());
        }
        catch(e) {
            console.log(e);
            console.log('[config] Error while parsing config/client.js');
        }

    });

    app.controllers.socket.addListener(socketListener);

};

const socketListener = function(message: any, socket: any) {

    // request configuration

    if(message.type === 'config') {
        app.controllers.socket.send(socket, {
            type: 'config',
            config: app.clientConfig
        });
    }

    // save configuration

    else if(message.type === 'config_save') {
        console.log('[config] Changing configuration');

        app.clientConfig = message.config;

        app.controllers.socket.broadcastToOthers(socket, {
            type: 'config',
            config: app.clientConfig
        });

        fs.writeFile(
            configPath,
            JSON.stringify(app.clientConfig),
            function(err) {
                if(err) {
                    console.log('[config] config/client.js could not be saved!');
                }
            }
        );
    }

};


module.exports = function(globalApp: Application) {
    app = globalApp;
    app.events.on('ready', init);
};