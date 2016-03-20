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
        addAssetPath(asset, path, overWrite = false) {
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
                let fileType = url.split('.')[2] || url.split('.')[1];
                let file = urlParts[urlParts.length - 1];
                let assetType = urlParts[urlParts.length - 2];

                if(assetPaths.indexOf(assetType) !== -1) { // If the asset has been speicified
                    this.renderAsset(this.assetPaths[assetType], file, res);
                }
                else if(assetPaths.indexOf(fileType) !== -1) {
                    this.renderAsset(this.assetPaths[fileType], file, res);
                }
                else {
                    let path = assetType;
                    if(urlParts.length > 2) {
                        path = urlParts.reduce((prevVal, nextVal, index) => {
                            let part = '';
                            if(index !== (urlParts.length - 1)) {
                                part = nextVal;
                            }

                            return prevVal + part;
                        });
                    }

                    this.renderAsset(path, file, res);
                }
            }
            else {
                if(routes.indexOf(url) !== -1) { // If the url is for a page route
                    this.routes[url](req, res, url);
                }
                else {
                    Object.keys(this.routes).forEach((route) => { // For each route check url parts against for route parameter against url
                        let routeParts = route.split('/');

                        if(routeParts.length > 1) {
                            let param;
                            for (var i = 0; i < routeParts.length; i++) { // For each
                                let part = routeParts[i];

                                if(part !== urlParts[i]) {
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
                                this.routes[route](req, res, url);
                            }
                        }
                        else {
                            if(routeParts[0] == url) {
                                this.routes[route](req, res, url);
                            }
                            else{
                                let param = this.parseURLParameter(urlParts[0], routeParts[0]);

                                if(param) {
                                    req.parameters = Object.assign(req.parameters, param);
                                    this.routes[route](req, res, url);
                                }
                                else {
                                    return this.pageNotFound(res, url);
                                }
                            }
                        }
                    });

                    return this.pageNotFound(res, url);
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
         * @param {Server.Response} res
         */
        renderAsset(path, file, res) {
            fs.readFile(`${path}/${file}`, (err, data) => {
                if(err) {
                    res.statusCode = 404;
                    res.end(`File ${path}/${file} doesn't exist`);
                }

                res.end(data);
            });
        }

        parseData(req, cb) {
            if(req.method == 'GET') {
                let params = req.url.split('?')[1] || false;

                if(params) {
                    cb(
                        null,
                        querystring.parse(params)
                    );
                }
                else {
                    cb(null, {});
                }
            }
            else if(req.method == 'POST') {
                let form = formidable.IncomingForm();
                form.parse(req, (err, fields, files) => {
                    if(err) {
                        return cb(err);
                    }

                    cb(err, {
                        fields: fields,
                        files: files
                    });
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
