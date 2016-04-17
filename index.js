"use strict";

const fs = require('fs');
const querystring = require('querystring');
const formidable = require('formidable');

module.exports = (http) => {
    class Router {
        constructor() {
            this.routes = {};
            this.assetPaths = {};
            this.server = http.createServer((req, res) => this.route(req, res));
            this.prefix = '/';
        }

        /**
         * Add route callback code to routes object
         * @param {string} path
         * @param {function} cb
         * @return {bool}
         */
        addRoute(route, cb) {
            let success = false;

            if(Array.isArray(route)) {
                route.forEach((route) => {
                    this.addRoute(route, cb);
                });
            }
            else {
                if(route.indexOf(this.prefix) !== 0) { // If the prefix has already been added to the route
                    route = this.prefix + route;
                }

                if(!this.routes.hasOwnProperty(route)) { // Check if the route already exists
                    this.routes[route] = cb;
                    success = true;
                }
                else{
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
         */
        addAssetPath(asset, path, overWrite) {
            overWrite = overWrite || false;
            let success = false;

            if((!this.assetPaths.hasOwnProperty(asset) && !overWrite) || overWrite) {
                if(asset.includes(',')) {
                    let assets = asset.split(',');

                    assets.forEach((assetType) => { // For each asset type add as asset path
                        this.addAssetPath(assetType, path, overWrite);
                    });
                }
                else {
                    this.assetPaths[asset] = path;
                }
            }
            else {
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
            let url = req.url;
            let routes = Object.keys(this.routes);
            let assetPaths = Object.keys(this.assetPaths);
            let urlParts = url.split('/');

            if(url.includes('.')) { // If the url is for an asset
                let fileType = url.split('.');
                fileType = fileType[fileType.length - 1];
                let file = url.replace('/', '');
                let assetType = urlParts[urlParts.length - 2];

                if(assetPaths.indexOf(assetType) !== -1) { // If the asset has been speicified
                    if(file.indexOf(assetType) !== -1) {
                        file = file.replace(`${assetType}/`, '');
                    }
                    this.renderAsset(this.assetPaths[assetType], file, assetType, res);
                }
                else if(assetPaths.indexOf(fileType) !== -1) {
                    this.renderAsset(this.assetPaths[fileType], file, fileType, res);
                }
                else {
                    let path = assetType;

                    if(this.assetPaths.hasOwnProperty(fileType)) {
                        file = this.assetPaths[file].replace(`${path}/`, '');
                    }

                    this.renderAsset(path, file, path, res);
                }
            }
            else {
                if(routes.indexOf(url) !== -1) { // If the url is for a page route
                    this.routes[url](req, res, url);
                }
                else {
                    let routeMatch = false;
                    Object.keys(this.routes).forEach((route) => { // For each route check url parts against for route parameter against url
                        if(!routeMatch) {
                            let routeParts = route.split('/');
                            // console.log("Route Parts", routeParts);
                            // console.log("URL Parts", urlParts);

                            if(routeParts.length > 1) {
                                let param;
                                for (var i = 0; i < routeParts.length; i++) { // For each
                                    let part = routeParts[i];

                                    if(part !== urlParts[i] && routeParts.length === urlParts.length) {
                                        param = this.parseURLParameter(urlParts[i], part);
                                        if(param) {
                                            req.parameters = Object.assign(req.parameters || {}, param);
                                        }
                                        else {
                                            break;
                                        }
                                    }
                                }

                                if(param) {
                                    routeMatch = true;
                                    return this.routes[route](req, res, url);
                                }
                            }
                            else if(routeParts.length === urlParts.length) {
                                if(routeParts[0] == url) {
                                    routeMatch = true;
                                    return this.routes[route](req, res, url);
                                }
                                else{
                                    let param = this.parseURLParameter(urlParts[0], routeParts[0]);

                                    if(param) {
                                        routeMatch = true;
                                        req.parameters = Object.assign(req.parameters, param);
                                        return this.routes[route](req, res, url);
                                    }
                                    else {
                                        routeMatch = true;
                                        return this.pageNotFound(res, url);
                                    }
                                }
                            }
                        }
                    });

                    if(!routeMatch) {
                        return this.pageNotFound(res, url);
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
         * Responde with asset file contents to the http request
         * @param {string} path
         * @param {string} file
         * @param {string} assetType
         * @param {Server.Response} res
         */
        renderAsset(path, file, assetType, res) {
            fs.readFile(`${path}${file}`, (err, data) => {
                if(err) {
                    res.statusCode = 404;
                    res.end(`File ${path}/${file} doesn't exist`);
                }


                if(assetType == 'css') {
                    res.writeHead(200, { 'Content-Type': 'text/css' });
                }

                res.end(data);
            });
        }

        parseData(req, cb) {
            if(req.method == 'POST') {
                let form = formidable.IncomingForm();
                form.parse(req, (err, fields, files) => {
                    if(err) {
                        return cb(err);
                    }

                    cb(
                        err,
                        fields,
                        files
                    );
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
            urlPart = urlPart || '';

            if(routePart.indexOf(':') === 0) {
                let param = {};
                let parameterSections = routePart.split('(');
                let paramName = parameterSections[0].replace(':', '');
                let regex = new RegExp(`(${parameterSections[1]}`);

                if(regex.test(urlPart)){
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

        close(cb) {
            this.server.close();
        }
    }



    return new Router();
};
