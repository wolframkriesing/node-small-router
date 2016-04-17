"use strict";

const should = require('should');
const http = require('http');
const router = require('../index')(http);
const querystring = require('querystring');
const fs = require('fs');

const SERVER_URL = 'http://localhost:8000';

describe('server', () => {
    before(() => {
        router.addRoute(['/', 'about'], (req, res, url) => {
            res.writeHead(200, { 'Content-Type': 'text/html' });
            res.end("test text");
        });

        router.addRoute('/api/register/hedgehog/:id([a-z]+)', (req, res, url) => {
            let parameters = req.parameters;
            res.writeHead(200, { 'Content-Type': 'text/html' });
            res.end(`${parameters.id} Hedgehog`);
        });

        router.addAssetPath('css', 'tests/css/');

        router.addRoute(':test([a-z]+)', (req, res, url) => {
            let parameters = req.parameters;
            res.writeHead(200, { 'Content-Type': 'text/html' });
            res.end(parameters.test);
        });

        router.addRoute('/test/parse-data', (req, res, url) => {
            router.parseData(req, (err, fields, files) => {
                if(err){
                    console.error(err);
                }
                res.writeHead(200, { 'Content-Type': 'text/html' });
                res.end(`Parse form data ${fields.test}`);
            });
        });

        router.addAssetPath('images', 'tests/images/');

        router.listen(8000);
    });

    describe('/', () => {
        it('should return 200 status code', (done) => {
            http.get(SERVER_URL, (res) => {
                res.statusCode.should.equal(200);
                done();
            });
        });

        it('should return \'test text\' response text', (done) => {
            http.get(SERVER_URL, (res) => {
                let data = '';

                res.on('data', (chunk) => {
                    data += chunk;
                });

                res.on('end', () => {
                    data.should.equal('test text');
                    done();
                });
            });
        });
    });

    describe('/api/register/hedgehog/:id([a-z]+)', () => {
        let routeExists = '/api/register/hedgehog/';

        it('should return 200 status code', (done) => {
            http.get(`${SERVER_URL}${routeExists}hii`, (res) => {
                res.statusCode.should.equal(200);
                done();
            });
        });

        it('should return \'hii Hedgehog\' response text', (done) => {
            http.get(`${SERVER_URL}${routeExists}hii`, (res) => {
                let data = '';
                res.on('data', (chunk) => {
                    data += chunk;
                }).on('end', () => {
                    data.should.equal('hii Hedgehog');
                    done();
                });
            });
        });

        it('should return \'test Hedgehog\' response text', (done) => {
            http.get(`${SERVER_URL}${routeExists}test`, (res) => {
                let data = '';
                res.on('data', (chunk) => {
                    data += chunk;
                }).on('end', () => {
                    data.should.equal('test Hedgehog');
                    done();
                });
            });
        });

        let routeNotExist = '/api/register/hedgehog';

        it('should return 404 status code', (done) => {
            http.get(`${SERVER_URL}${routeNotExist}`, (res) => {
                res.statusCode.should.equal(404);
                done();
            });
        });

        it('should return \'Route /api/register/hedgehog does not exist\' response text', (done) => {
            http.get(`${SERVER_URL}${routeNotExist}`, (res) => {
                let data = '';
                res.on('data', chunk => data += chunk).on('end', () => {
                    data.should.equal('Route /api/register/hedgehog does not exist');
                    done();
                });
            });
        });
    });

    describe('/api/moo', () => {
        let route = '/api/moo';

        it('should return 404 status code', (done) => {
            http.get(`${SERVER_URL}${route}`, (res) => {
                res.statusCode.should.equal(404);
                done();
            });
        });

        it('should return \'Route /api/moo does not exist\' response text', (done) => {
            http.get(`${SERVER_URL}${route}`, (res) => {
                let data = '';
                res.on('data', chunk => data += chunk).on('end', () => {
                    data.should.equal('Route /api/moo does not exist');
                    done();
                });
            });
        });
    });

    describe('/style.css, assets', () => {
        let route = '/style.css';

        it('it should return 200 status code', (done) => {
            http.get(`${SERVER_URL}${route}`, (res) => {
                res.statusCode.should.equal(200);
                done();
            });
        });

        it('it should return css file contents', (done) => {
            http.get(`${SERVER_URL}${route}`, (res) => {
                let data = '';
                res.on('data', chunk => data += chunk).on('end', () => {
                    if(/^win/.test(process.platform)) {
                        data.should.equal(`html {\r\n    text-align: center;\r\n}\r\n`);
                    }
                    else {
                        data.should.equal(`html {\n    text-align: center;\n}\n`);
                    }

                    done();
                });
            });
        });
    });

    describe('/images/loader.gif', (parameters) => {
        let route = 'images/loader.gif';

        it('it should return 200 status code', (done) => {
            http.get(`${SERVER_URL}/${route}`, (res) => {
                res.statusCode.should.equal(200);
                done();
            });
        });

        it('it should return gif image file contents', (done) => {
            http.get(`${SERVER_URL}/${route}`, (res) => {
                let data = '';
                res.on('data', chunk => data += chunk).on('end', () => {
                    fs.readFile(`tests/${route}`, (err, data) => {
                        if(err) {
                            throw err;
                        }

                        data.should.equal(data);
                        done();
                    });
                });
            });
        });
    });

    describe('/:test([a-z]+)', () => {
        let route = '/test-route';

        it('it should return 200 status code', (done) => {
            http.get(`${SERVER_URL}${route}`, (res) => {
                res.statusCode.should.equal(200);
                done();
            });
        });

        it('it should return \'test-route\' response text', (done) => {
            http.get(`${SERVER_URL}${route}`, (res) => {
                let data = '';
                res.on('data', chunk => data += chunk).on('end', () => {
                    data.should.equal('test-route');
                    done();
                });
            });
        });
    });

    describe('/about', () => {
        let route = '/about';

        it('it should return 200 status code', (done) => {
            http.get(`${SERVER_URL}${route}`, (res) => {
                res.statusCode.should.equal(200);
                done();
            });
        });
    });

    describe('/test/parse-data', () => {
        let route = '/test/parse-data';
        let postData = querystring.stringify({
            test: 'test string'
        });

        it('it should return 200 status code', (done) => {
            let req = http.request({
                url: `http://localhost/`,
                port: '8000',
                method: 'POST',
                path: route,
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                    'Content-Length': Buffer.byteLength(postData)
                }
            }, (res) => {
                res.statusCode.should.equal(200);
                done();
            });

            req.on('error', (err) => {
                console.log('Error', err);
                done();
            });

            req.write(postData);
            req.end();
        });

        it('it should return \'Parse form data test string\' response text', (done) => {
            let req = http.request({
                url: `http://localhost/`,
                port: '8000',
                method: 'POST',
                path: route,
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                    'Content-Length': Buffer.byteLength(postData)
                }
            }, (res) => {
                let data = '';
                res.on('data', chunk => data += chunk).on('end', () => {
                    data.should.equal('Parse form data test string');
                    done();
                });
            });

            req.on('error', (err) => {
                console.log('Error', err);
                done();
            });

            req.write(postData);
            req.end();
        });
    });

    describe('/about Route already exists', () => {
        it('it should throw an error \'Route already exists /about\'', () => {
            (() => {
                router.addRoute('/about', (req, res, url) => {
                    res.end("hii");
                });
            }).should.throw('Route already exists /about');
        });
    });

    after(() => {
        router.close();
    });
});
