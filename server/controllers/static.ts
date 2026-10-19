import * as fs from "node:fs";
import * as http from "node:http";
import * as path from "node:path";
import type { Application } from "../types";

const contentTypes: Record<string, string> = {
    ".css": "text/css; charset=utf-8",
    ".eot": "application/vnd.ms-fontobject",
    ".gif": "image/gif",
    ".html": "text/html; charset=utf-8",
    ".ico": "image/x-icon",
    ".js": "text/javascript; charset=utf-8",
    ".png": "image/png",
    ".svg": "image/svg+xml",
    ".ttf": "font/ttf",
    ".woff": "font/woff",
    ".woff2": "font/woff2"
};

let app: Application;

function isWithinRoot(root: string, filePath: string): boolean {
    const relativePath = path.relative(root, filePath);
    return relativePath === "" ||
        (relativePath !== ".." &&
            !relativePath.startsWith(".." + path.sep) &&
            !path.isAbsolute(relativePath));
}

function serveFile(root: string, request: http.IncomingMessage, response: http.ServerResponse): void {
    if (request.method !== "GET" && request.method !== "HEAD") {
        response.statusCode = 405;
        response.setHeader("Allow", "GET, HEAD");
        response.end();
        return;
    }

    let requestedPath: string;
    try {
        requestedPath = decodeURIComponent(new URL(request.url || "/", "http://localhost").pathname);
    } catch {
        response.statusCode = 400;
        response.end("Bad request");
        return;
    }

    const filePath = path.resolve(root, "." + (requestedPath === "/" ? "/index.html" : requestedPath));
    if (!isWithinRoot(root, filePath)) {
        response.statusCode = 403;
        response.end("Forbidden");
        return;
    }

    fs.realpath(filePath, function(realPathError, realPath) {
        if (realPathError) {
            if (realPathError.code !== "ENOENT" && realPathError.code !== "ENOTDIR") {
                console.log("[static] Could not resolve " + requestedPath + ":", realPathError);
            }
            response.statusCode = realPathError.code === "ENOENT" || realPathError.code === "ENOTDIR" ? 404 : 500;
            response.end(response.statusCode === 404 ? "Not found" : "Server error");
            return;
        }

        if (!isWithinRoot(root, realPath)) {
            response.statusCode = 403;
            response.end("Forbidden");
            return;
        }

        fs.stat(realPath, function(statError, stats) {
            if (statError) {
                if (statError.code !== "ENOENT" && statError.code !== "ENOTDIR") {
                    console.log("[static] Could not inspect " + requestedPath + ":", statError);
                }
                response.statusCode = statError.code === "ENOENT" || statError.code === "ENOTDIR" ? 404 : 500;
                response.end(response.statusCode === 404 ? "Not found" : "Server error");
                return;
            }

            if (!stats.isFile()) {
                response.statusCode = 404;
                response.end("Not found");
                return;
            }

            response.statusCode = 200;
            response.setHeader("Cache-Control", "no-store");
            response.setHeader("Content-Length", stats.size);
            response.setHeader("Content-Type", contentTypes[path.extname(realPath).toLowerCase()] || "application/octet-stream");
            response.setHeader("X-Content-Type-Options", "nosniff");
            if (request.method === "HEAD") {
                response.end();
                return;
            }

            const stream = fs.createReadStream(realPath);
            stream.on("error", function(error) {
                console.log("[static] Could not read " + requestedPath + ":", error);
                if (!response.headersSent) {
                    response.statusCode = 500;
                    response.end("Server error");
                } else {
                    response.destroy();
                }
            });
            stream.pipe(response);
        });
    });
}

const init = function() {
    const serveClient = function(directory: string, port: number, label: string) {
        const root = path.resolve(__dirname, "../../../" + directory);
        const server = http.createServer(function(request, response) {
            serveFile(root, request, response);
        });

        server.on("error", function(error) {
            console.log("[static] " + label + " client server error:", error);
        });
        server.listen(port, function() {
            console.log("[static] " + label + " client started at port " + port);
        });
    };

    serveClient("client", app.config.staticPort, "Legacy");
    serveClient("client-modern", app.config.channelStripPort, "Channel-strip");
};

module.exports = function(globalApp: Application) {
    app = globalApp;
    app.events.on("ready", init);
};
