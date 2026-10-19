import * as http from "node:http";
import * as path from "node:path";
import type { Application } from "../types";

const staticFiles = require('node-static');
let app: Application;


const init = function() {
    const fileServer = new staticFiles.Server(
        path.resolve(__dirname, '../../../client'),
        {
            cache: 0
        }
    );

    http.createServer(function (request, response) {

        request.addListener('end', function () {
            fileServer.serve(request, response);
        }).resume();

    }).listen(app.config.staticPort);

    console.log('[static] Web server started at port ' + app.config.staticPort);
};



module.exports = function(globalApp: Application) {
    app = globalApp;
    app.events.on('ready', init);
};