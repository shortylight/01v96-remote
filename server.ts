import * as os from "node:os";
import type { Application } from "./server/types";

console.log('\n\n=== 01v96 Remote server by Michael Strobel ===\n\n');

// global application object and base configuration

const app: Application = {
    config: {
        staticPort: 1337,
        channelStripPort: 1339,
        webSocketPort: 1338
    },

    clientConfig: {
        names: {},
        groups: []
    },

    events: require('./server/modules/events'),

    controllers: {}
};


// load controllers

const controllerFactories: Record<string, (application: Application) => unknown> = {
    config: require('./server/controllers/config'),
    mixer: require('./server/controllers/mixer'),
    socket: require('./server/controllers/socket'),
    static: require('./server/controllers/static')
};

Object.keys(controllerFactories).forEach(function(controller) {
    app.controllers[controller] = controllerFactories[controller](app);
});


// fire ready event
app.events.fire('ready');
const clientAddresses = Object.values(os.networkInterfaces())
    .flatMap((interfaces) => interfaces || [])
    .filter((address) => address.family === 'IPv4' && !address.internal)
    .map((address) => 'http://' + address.address + ':' + app.config.channelStripPort + '/');
if (!clientAddresses.length) {
    clientAddresses.push('http://localhost:' + app.config.channelStripPort + '/');
}
console.log('[server] Open the channel-strip client at ' + clientAddresses.join(' or '));
