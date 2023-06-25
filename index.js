"use strict";

// @ts-check
/// <reference path="./index.d.ts>"

const fs = require("fs");
const querystring = require("querystring");
const formidable = require("formidable");
const url = require("url");
const { join: joinPath } = require("path");

module.exports = (http) => {
    class Router {
        constructor() {
            this.routes = {};
            this.assetPaths = {};
            this.server = http.createServer((req, res) => this.route(req, res));
            this.prefix = "/";
        }

        /**
         * Add route callback code to routes object
         * @param {string} path
         * @param {function} cb
         * @param {method} method
         * @return {bool}
         */
        addRoute(route, cb, method) {
            method = method ? method : "*"; // old school default param

            let success = false;

            if (Array.isArray(route)) {
                route.forEach((route) => {
                    this.addRoute(route, cb, method);
                });
            } else {
                if (route.indexOf(this.prefix) !== 0) {
                    // If the prefix has already been added to the route
                    route = this.prefix + route;
                }

                if (!this.routes.hasOwnProperty(route)) {
                    // Check if the route already exists
                    this.routes[route] = {
                        method: method,
                        cb: cb,
                    };
                    success = true;
                } else {
                    throw new Error(`Route already exists ${route}`);
                }
            }

            return success;
        }

        /**
         * Add path for types of assets (e.g. images, css, client side javascript)
         * @param {string} asset
         * @param {string} path
         * @param {bool} overWrite
         * @param {string} stripFromPath
         */
        addAssetPath(asset, path, overWrite, stripFromPath = "") {
            overWrite = overWrite || false;
            let success = false;

            if (
                (!this.assetPaths.hasOwnProperty(asset) && !overWrite) ||
                overWrite
            ) {
                if (asset.includes(",")) {
                    let assets = asset.split(",");

                    assets.forEach((assetType) => {
                        // For each asset type add as asset path
                        this.addAssetPath(
                            assetType,
                            path,
                            overWrite,
                            stripFromPath
                        );
                    });
                } else {
                    this.assetPaths[asset] = { path, stripFromPath };
                }
            } else {
                throw new Error(`Asset ${asset} path has already been defined`);
            }

            return success;
        }

        /**
         * Handle http request and responses using the routes creates using addRoute
         * @param {IncomingRequest} req
         * @param {ServerResponse} res
         */
        route(req, res) {
            const rawUrl = req.url;
            const routes = Object.keys(this.routes);
            const assetPaths = Object.keys(this.assetPaths);
            const parsedUrl = url.parse(rawUrl);
            const urlPathname = parsedUrl.pathname.replaceAll(/\/+/g, "/");
            const urlParts = parsedUrl.pathname.split("/");
            const queryString = querystring.parse(parsedUrl.query);

            const isOneOfRoutes = routes.includes(urlPathname);
            if (isOneOfRoutes === false && urlPathname.includes(".")) {
                // If the url is for an asset
                let fileType = rawUrl.split(".");
                fileType = fileType[fileType.length - 1];
                let file = rawUrl.replace("/", "");
                let assetType = urlParts[1];

                if (assetPaths.indexOf(assetType) !== -1) {
                    // If the asset has been specified
                    if (file.indexOf(assetType) !== -1) {
                        file = file.replace(`${assetType}/`, "");
                    }

                    if (
                        this.assetPaths[assetType] &&
                        this.assetPaths[assetType].hasOwnProperty("path")
                    ) {
                        const { path, stripFromPath } =
                            this.assetPaths[assetType];
                        return this.renderAsset(
                            path,
                            file,
                            assetType,
                            res,
                            stripFromPath
                        );
                    }
                } else if (
                    assetPaths.indexOf(fileType) !== -1 &&
                    this.assetPaths[fileType].hasOwnProperty("path")
                ) {
                    const { path, stripFromPath } = this.assetPaths[fileType];
                    return this.renderAsset(
                        path,
                        file,
                        fileType,
                        res,
                        stripFromPath
                    );
                } else {
                    if (
                        this.assetPaths.hasOwnProperty(fileType) &&
                        this.assetPaths[fileType].hasOwnProperty("path")
                    ) {
                        const { path: filePath } = this.assetPaths[file];
                        file = filePath.replace(`${assetType}/`, "");
                        return this.renderAsset(
                            assetType,
                            file,
                            assetType,
                            res
                        );
                    }
                }

                this.pageNotFound(res, rawUrl);
            } else {
                if (routes.indexOf(urlPathname) !== -1) {
                    // If the url is for a page route
                    const { method, cb } = this.routes[urlPathname];
                    if (!this.checkMethod(req, res, method)) {
                        return;
                    }
                    cb(req, res, rawUrl, queryString);
                } else {
                    let routeMatch = false;
                    Object.keys(this.routes).forEach((route) => {
                        // For each route check url parts against for route parameter against url
                        if (!routeMatch) {
                            let routeParts = route.split("/");
                            // console.log("Route Parts", routeParts);
                            // console.log("URL Parts", urlParts);

                            if (routeParts.length > 1) {
                                let param;
                                for (var i = 0; i < routeParts.length; i++) {
                                    // For each
                                    let part = routeParts[i];

                                    if (
                                        part !== urlParts[i] &&
                                        routeParts.length === urlParts.length
                                    ) {
                                        param = this.parseURLParameter(
                                            urlParts[i],
                                            part
                                        );
                                        if (param) {
                                            req.parameters = Object.assign(
                                                req.parameters || {},
                                                param
                                            );
                                        } else {
                                            break;
                                        }
                                    }
                                }

                                if (param) {
                                    routeMatch = true;
                                    const { method, cb } = this.routes[route];

                                    if (!this.checkMethod(req, res, method)) {
                                        return;
                                    }
                                    return cb(req, res, rawUrl, queryString);
                                }
                            } else if (routeParts.length === urlParts.length) {
                                if (routeParts[0] === rawUrl) {
                                    routeMatch = true;

                                    const { method, cb } = this.routes[route];
                                    if (!this.checkMethod(req, res, method)) {
                                        return;
                                    }
                                    return cb(req, res, rawUrl, queryString);
                                } else {
                                    let param = this.parseURLParameter(
                                        urlParts[0],
                                        routeParts[0]
                                    );

                                    if (param) {
                                        routeMatch = true;
                                        req.parameters = Object.assign(
                                            req.parameters,
                                            param
                                        );

                                        const { method, cb } =
                                            this.routes[route];
                                        if (
                                            !!this.checkMethod(req, res, method)
                                        ) {
                                            return;
                                        }
                                        return cb(
                                            req,
                                            res,
                                            rawUrl,
                                            queryString
                                        );
                                    } else {
                                        routeMatch = true;

                                        return this.pageNotFound(res, rawUrl);
                                    }
                                }
                            }
                        }
                    });

                    if (!routeMatch) {
                        return this.pageNotFound(res, rawUrl);
                    }
                }
            }
        }

        /**
         * Wrapper for http.createServer.listen
         * @param {int} port
         * @param {function} cb
         */
        listen(port, cb) {
            this.server.listen(port, cb);
        }

        /**
         * Respond with asset file contents to the http request
         * @param {string} path
         * @param {string} file
         * @param {string} assetType
         * @param {Server.Response} res
         * @param string stripFromPath
         */
        renderAsset(path, file, assetType, res, stripFromPath) {
            file = file.replace(/\.\.\//g, "");
            const filePath = joinPath(path, file).replace(stripFromPath, "");

            fs.readFile(filePath, (err, data) => {
                if (err) {
                    // console.error(err);
                    res.statusCode = 404;
                    res.end(`File not found`);
                }

                if (assetType === "js" || file.endsWith(".js")) {
                    res.writeHead(200, { "Content-Type": "text/javascript" });
                }

                if (assetType === "css" || file.endsWith(".css")) {
                    res.writeHead(200, { "Content-Type": "text/css" });
                }

                if (assetType === "svg" || file.endsWith(".svg")) {
                    res.writeHead(200, { "Content-Type": "image/svg+xml" });
                }

                res.end(data);
            });
        }

        parseData(req, cb) {
            if (req.method == "POST") {
                let form = formidable.IncomingForm();
                form.parse(req, (err, fields, files) => {
                    if (err) {
                        return cb(err);
                    }

                    cb(err, fields, files);
                });
            }
        }

        /**
         * Parse URL parameter from URL
         * @param {string} urlPart
         * @param {string} routePart
         * @return string/bool
         */
        parseURLParameter(urlPart, routePart) {
            let rtrn = false;
            urlPart = urlPart || "";

            if (routePart.indexOf(":") === 0) {
                let param = {};
                let parameterSections = routePart.split("(");
                if (parameterSections.length < 2) {
                    throw new Error(
                        "Regex is missing from " +
                        parameterSections[0] +
                        '. Url parameters request a regex in "/:param(regex)" format.'
                    );
                }
                let paramName = parameterSections[0].replace(":", "");
                let regex = new RegExp(`(${parameterSections[1]}`);

                if (regex.test(urlPart)) {
                    param[paramName] = urlPart;

                    rtrn = param;
                }
            }

            return rtrn;
        }

        /**
         * If route is not found respond with 404 route/page not found
         * @param {object} res
         * @param {string} url
         */
        pageNotFound(res, url) {
            res.statusCode = 404;
            let notFound = this.notFound || `Route ${url} does not exist`;

            res.end(notFound);
        }

        close() {
            this.server.close();
        }

        get(route, cb) {
            this.addRoute(route, cb, "GET");
        }

        post(route, cb) {
            this.addRoute(route, cb, "POST");
        }

        put(route, cb) {
            this.addRoute(route, cb, "PUT");
        }

        delete(route, cb) {
            this.addRoute(route, cb, "DELETE");
        }

        /**
         * Check if the request method is what was expected for the route
         *
         * @param {http.IncomingMessage} req
         * @param {http.ServerResponse} res
         * @param {string} expected
         * @return {boolean}
         */
        checkMethod(req, res, expected) {
            if (expected === "*") {
                return true;
            }

            if (req.method.toLowerCase() === expected.toLowerCase()) {
                return true;
            }

            res.statusCode = 405;
            res.end(`Method not allowed for ${req.url}`);
            return false;
        }
    }

    return new Router();
};
