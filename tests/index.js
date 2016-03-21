"use strict";

const should = require('should');
const http = require('http');
const router = require('../index')(http);

const SERVER_URL = 'http://localhost:8000';

describe('server', () => {
    before(() => {
        router.addRoute('/', (req, res, url) => {
            res.writeHead(200, { 'Content-Type': 'text/html' });
            res.end("test text");
        });

        router.addRoute('/api/register/hedgehog/:id([a-z]+)', (req, res, url) => {
            let parameters = req.parameters;
            res.writeHead(200, { 'Content-Type': 'text/html' });
            res.end(`${parameters.id} Hedgehog`);
        });

        router.listen(8000);
    });

    describe('/', () => {
        it('should return 200 status code', (done) => {
            http.get(SERVER_URL, (res) => {
                res.statusCode.should.equal(200);
                done();
            });
        });

        it('should return test text response text', (done) => {
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

        it('should return hii Hedgehog response text', (done) => {
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

        it('should return test Hedgehog response text', (done) => {
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

        it('should return Route /api/register/hedgehog does not exist response text', (done) => {
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

        it('should return Route /api/moo does not exist response text', (done) => {
            http.get(`${SERVER_URL}${route}`, (res) => {
                let data = '';
                res.on('data', chunk => data += chunk).on('end', () => {
                    data.should.equal('Route /api/moo does not exist');
                    done();
                });
            });
        });
    });

    after(() => {
        router.close();
    });
});
