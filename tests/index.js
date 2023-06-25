"use strict";

const should = require("should");
const http = require("http");
const router = require("../index")(http);
const querystring = require("querystring");
const fs = require("fs");

const SERVER_URL = "http://localhost:8000";

describe("server", () => {
    before(() => {
        router.addRoute(["/", "about", "about/"], (req, res, url) => {
            res.writeHead(200, { "Content-Type": "text/html" });
            res.end("test text");
        });

        router.addRoute(
            "/api/register/hedgehog/:id([a-z]+)",
            (req, res, url) => {
                let parameters = req.parameters;
                res.writeHead(200, { "Content-Type": "text/html" });
                res.end(`${parameters.id} Hedgehog`);
            }
        );

        router.addAssetPath("css", "tests/css/");

        router.addRoute(":test([a-z]+)", (req, res, url) => {
            let parameters = req.parameters;
            res.writeHead(200, { "Content-Type": "text/html" });
            res.end(parameters.test);
        });

        router.addRoute("/test/parse-data", (req, res, url) => {
            router.parseData(req, (err, fields, files) => {
                if (err) {
                    console.error(err);
                }
                res.writeHead(200, { "Content-Type": "text/html" });
                res.end(`Parse form data ${fields.test}`);
            });
        });

        router.addRoute("/another/test", (req, res, url) => {
            res.writeHead(200, { "Content-Type": "text/html" });
            res.end("another test route");
        });

        router.addRoute(
            "/another/test/with/query-string",
            (req, res, url, queryString) => {
                res.writeHead(200, { "Context-Type": "text/html" });
                res.end(JSON.stringify(queryString));
            }
        );

        router.addRoute("/README.md", (req, res) => {
            res.writeHead(200, { "Context-Type": "text/plain" });
            res.end("README.md content");
        });

        router.get("/test/get/method", (req, res) => {
            res.writeHead(200, { "Content-Type": "text/html" });
            res.end("test text");
        });

        router.post("/test/post/method", (req, res) => {
            res.writeHead(200, { "Content-Type": "text/html" });
            res.end("test text");
        });

        router.put("/test/put/method", (req, res) => {
            res.writeHead(200, { "Content-Type": "text/html" });
            res.end("test text");
        });

        router.delete("/test/delete/method", (req, res) => {
            res.writeHead(200, { "Content-Type": "text/html" });
            res.end("test text");
        });

        router.addAssetPath("images", "tests/images/");
        router.addAssetPath("js", "tests/js/");

        router.listen(8000);
    });

    describe("/", () => {
        it("should return 200 status code", (done) => {
            http.get(SERVER_URL, (res) => {
                res.statusCode.should.equal(200);
                done();
            });
        });

        it("should return 'test text' response text", (done) => {
            http.get(SERVER_URL, (res) => {
                let data = "";

                res.on("data", (chunk) => {
                    data += chunk;
                });

                res.on("end", () => {
                    data.should.equal("test text");
                    done();
                });
            });
        });
    });

    describe("/api/register/hedgehog/:id([a-z]+)", () => {
        let routeExists = "/api/register/hedgehog/";

        it("should return 200 status code", (done) => {
            http.get(`${SERVER_URL}${routeExists}hii`, (res) => {
                res.statusCode.should.equal(200);
                done();
            });
        });

        it("should return 'hii Hedgehog' response text", (done) => {
            http.get(`${SERVER_URL}${routeExists}hii`, (res) => {
                let data = "";
                res.on("data", (chunk) => {
                    data += chunk;
                }).on("end", () => {
                    data.should.equal("hii Hedgehog");
                    done();
                });
            });
        });

        it("should return 'test Hedgehog' response text", (done) => {
            http.get(`${SERVER_URL}${routeExists}test`, (res) => {
                let data = "";
                res.on("data", (chunk) => {
                    data += chunk;
                }).on("end", () => {
                    data.should.equal("test Hedgehog");
                    done();
                });
            });
        });

        let routeNotExist = "/api/register/hedgehog";

        it("should return 404 status code", (done) => {
            http.get(`${SERVER_URL}${routeNotExist}`, (res) => {
                res.statusCode.should.equal(404);
                done();
            });
        });

        it("should return 'Route /api/register/hedgehog does not exist' response text", (done) => {
            http.get(`${SERVER_URL}${routeNotExist}`, (res) => {
                let data = "";
                res.on("data", (chunk) => (data += chunk)).on("end", () => {
                    data.should.equal(
                        "Route /api/register/hedgehog does not exist"
                    );
                    done();
                });
            });
        });
    });

    describe("/api/moo", () => {
        let route = "/api/moo";

        it("should return 404 status code", (done) => {
            http.get(`${SERVER_URL}${route}`, (res) => {
                res.statusCode.should.equal(404);
                done();
            });
        });

        it("should return 'Route /api/moo does not exist' response text", (done) => {
            http.get(`${SERVER_URL}${route}`, (res) => {
                let data = "";
                res.on("data", (chunk) => (data += chunk)).on("end", () => {
                    data.should.equal("Route /api/moo does not exist");
                    done();
                });
            });
        });
    });

    describe("assets - css, js, svg", () => {
        let route = "/style.css";

        it("it should return 200 status code", (done) => {
            http.get(`${SERVER_URL}${route}`, (res) => {
                res.statusCode.should.equal(200);
                done();
            });
        });

        it("it should return css file contents", (done) => {
            const css = fs.readFileSync(__dirname + "/css/style.css");

            http.get(`${SERVER_URL}${route}`, (res) => {
                let data = "";
                res.on("data", (chunk) => (data += chunk)).on("end", () => {
                    data.should.equal(css.toString());
                    done();
                });
            });
        });

        it("when serving an SVG file the right content-type is sent", (done) => {
            http.get(`${SERVER_URL}/images/empty.svg`, (res) => {
                res.headers["content-type"].should.equal("image/svg+xml");
                done();
            });
        });

        it("should return the content-type `javascript` also when the asset path is some random string", (done) => {
            router.addAssetPath("random-string1", "tests/js/");
            http.get(`${SERVER_URL}/random-string1/empty.js`, (res) => {
                res.headers["content-type"].should.equal("text/javascript");
                done();
            });
        });
        it("should return the content-type `css` also when the asset path is some random string", (done) => {
            router.addAssetPath("random-string2", "tests/css/");
            http.get(`${SERVER_URL}/random-string2/style.css`, (res) => {
                res.headers["content-type"].should.equal("text/css");
                done();
            });
        });

        it("should also find assetPath when defined *without* trailing slash", (done) => {
            const pathWithoutTrailingSlash = "tests/js";
            router.addAssetPath("javascript", pathWithoutTrailingSlash);
            http.get(`${SERVER_URL}/javascript/empty.js`, (res) => {
                res.statusCode.should.equal(200);
                done();
            });
        });
    });

    describe("/images/loader.gif", () => {
        let route = "images/loader.gif";

        it("it should return 200 status code", (done) => {
            http.get(`${SERVER_URL}/${route}`, (res) => {
                res.statusCode.should.equal(200);
                done();
            });
        });

        it("it should return gif image file contents", (done) => {
            http.get(`${SERVER_URL}/${route}`, (res) => {
                let data = "";
                res.on("data", (chunk) => (data += chunk)).on("end", () => {
                    fs.readFile(`tests/${route}`, (err, data) => {
                        if (err) {
                            throw err;
                        }

                        data.should.equal(data);
                        done();
                    });
                });
            });
        });
    });

    describe("/jspm_packages/github/capaj/systemjs-hot-reloader@0.5.7.js", () => {
        let route =
            "/jspm_packages/github/capaj/systemjs-hot-reloader@0.5.7.js";

        it("it should return 200 status code", (done) => {
            http.get(`${SERVER_URL}/${route}`, (res) => {
                res.statusCode.should.equal(200);
                done();
            });
        });

        it("it should return contents of systemjs-hot-reloader@0.5.7.js", (done) => {
            http.get(`${SERVER_URL}/${route}`, (res) => {
                let data = "";
                res.on("data", (chunk) => (data += chunk)).on("end", () => {
                    fs.readFile(`tests/js${route}`, (err, data) => {
                        if (err) {
                            throw err;
                        }

                        data.should.equal(data);
                        done();
                    });
                });
            });
        });
    });

    describe("/:test([a-z]+)", () => {
        let route = "/test-route";

        it("it should return 200 status code", (done) => {
            http.get(`${SERVER_URL}${route}`, (res) => {
                res.statusCode.should.equal(200);
                done();
            });
        });

        it("it should return 'test-route' response text", (done) => {
            http.get(`${SERVER_URL}${route}`, (res) => {
                let data = "";
                res.on("data", (chunk) => (data += chunk)).on("end", () => {
                    data.should.equal("test-route");
                    done();
                });
            });
        });
    });

    describe("/about", () => {
        let route = "/about";

        it("it should return 200 status code", (done) => {
            http.get(`${SERVER_URL}${route}`, (res) => {
                res.statusCode.should.equal(200);
                done();
            });
        });
    });

    describe("/test/parse-data", () => {
        let route = "/test/parse-data";
        let postData = querystring.stringify({
            test: "test string",
        });

        it("it should return 200 status code", (done) => {
            let req = http.request(
                {
                    url: `http://localhost/`,
                    port: "8000",
                    method: "POST",
                    path: route,
                    headers: {
                        "Content-Type": "application/x-www-form-urlencoded",
                        "Content-Length": Buffer.byteLength(postData),
                    },
                },
                (res) => {
                    res.statusCode.should.equal(200);
                    done();
                }
            );

            req.on("error", (err) => {
                console.log("Error", err);
                done();
            });

            req.write(postData);
            req.end();
        });

        it("it should return 'Parse form data test string' response text", (done) => {
            let req = http.request(
                {
                    url: `http://localhost/`,
                    port: "8000",
                    method: "POST",
                    path: route,
                    headers: {
                        "Content-Type": "application/x-www-form-urlencoded",
                        "Content-Length": Buffer.byteLength(postData),
                    },
                },
                (res) => {
                    let data = "";
                    res.on("data", (chunk) => (data += chunk)).on("end", () => {
                        data.should.equal("Parse form data test string");
                        done();
                    });
                }
            );

            req.on("error", (err) => {
                console.log("Error", err);
                done();
            });

            req.write(postData);
            req.end();
        });
    });

    describe("/about Route already exists", () => {
        it("it should throw an error 'Route already exists /about'", () => {
            (() => {
                router.addRoute("/about", (req, res, url) => {
                    res.end("hii");
                });
            }).should.throw("Route already exists /about");
        });
    });

    describe("Routes with querystrings", function () {
        it("it should accept query strings as part of the route", (done) => {
            http.get(
                `${SERVER_URL}/another/test?fbclid=IwAR2kJ3zxaGmHK`,
                (res) => {
                    res.statusCode.should.equal(200);

                    let body = "";
                    res.on("data", (chunk) => {
                        body += chunk;
                    }).on("end", () => {
                        body.should.equal("another test route");
                        done();
                    });
                }
            );
        });

        it("it should send query string back as json", (done) => {
            http.get(
                `${SERVER_URL}/another/test/with/query-string?test=true`,
                (res) => {
                    res.statusCode.should.equal(200);

                    let body = "";
                    res.on("data", (chunk) => {
                        body += chunk;
                    }).on("end", () => {
                        JSON.stringify({ test: "true" }).should.equal(body);
                        done();
                    });
                }
            );
        });

        it('should allow "." in the search/query params', (done) => {
            http.get(`${SERVER_URL}/about/?test=22.33&moo=-!@£$%%`, (res) => {
                res.statusCode.should.equal(200);
                let data = "";
                res.on("data", (chunk) => (data += chunk)).on("end", () => {
                    data.should.equal("test text");
                    done();
                });
            });
        });

        it("should allow all special chars in the search/query params", (done) => {
            http.get(
                `${SERVER_URL}/about/?test=22.33&moo=-!@£$%%^&*()_-+=[]{}~\`?±§/`,
                (res) => {
                    res.statusCode.should.equal(200);
                    let data = "";
                    res.on("data", (chunk) => (data += chunk)).on("end", () => {
                        data.should.equal("test text");
                        done();
                    });
                }
            );
        });
    });

    describe("Routes with specific request methods", function () {
        it("it should only accept get method requests", (done) => {
            Promise.all([
                new Promise((resolve, reject) => {
                    http.get(`${SERVER_URL}/test/get/method`, (res) => {
                        res.statusCode.should.equal(200);

                        let body = "";
                        res.on("data", (chunk) => (body += chunk)).on(
                            "end",
                            () => {
                                body.should.equal("test text");
                                resolve();
                            }
                        );
                    });
                }),
                new Promise((resolve, reject) => {
                    const req = http.request(
                        {
                            url: `http://localhost/`,
                            port: "8000",
                            method: "POST",
                            path: "/test/get/method",
                        },
                        (res) => {
                            res.statusCode.should.equal(405);
                            let body = "";
                            res.on("data", (chunk) => (body += chunk)).on(
                                "end",
                                () => {
                                    body.should.equal(
                                        "Method not allowed for /test/get/method"
                                    );
                                    resolve();
                                }
                            );
                        }
                    );

                    req.on("error", (err) => {
                        throw err;
                    });

                    req.end();
                }),
            ]).then(() => done());
        });

        it("it should only accept post requests", (done) => {
            const path = "/test/post/method";
            Promise.all([
                new Promise((resolve, reject) => {
                    const req = http.request(
                        {
                            url: "http://locahost",
                            port: "8000",
                            method: "POST",
                            path,
                        },
                        (res) => {
                            res.statusCode.should.equal(200);
                            let body = "";
                            res.on("data", (chunk) => (body += chunk)).on(
                                "end",
                                () => {
                                    body.should.equal("test text");
                                    resolve();
                                }
                            );
                        }
                    );

                    req.on("error", (err) => {
                        throw err;
                    });
                    req.end();
                }),
                new Promise((resolve, reject) => {
                    http.get(`${SERVER_URL}${path}`, (res) => {
                        res.statusCode.should.equal(405);

                        let body = "";
                        res.on("data", (chunk) => (body += chunk)).on(
                            "end",
                            () => {
                                body.should.equal(
                                    `Method not allowed for ${path}`
                                );
                                resolve();
                            }
                        );
                    });
                }),
            ]).then(() => done());
        });

        it("it should only accept put method requests", (done) => {
            const path = "/test/put/method";

            Promise.all([
                new Promise((resolve, reject) => {
                    const req = http.request(
                        {
                            url: "http://locahost",
                            port: 8000,
                            path,
                            method: "PUT",
                        },
                        (res) => {
                            res.statusCode.should.equal(200);

                            let body = "";
                            res.on("data", (chunk) => (body += chunk)).on(
                                "end",
                                () => {
                                    body.should.equal("test text");
                                    resolve();
                                }
                            );
                        }
                    );

                    req.on("error", (err) => {
                        throw err;
                    }).end();
                }),
                new Promise((resolve, reject) => {
                    http.get(`${SERVER_URL}${path}`, (res) => {
                        res.statusCode.should.equal(405);

                        let body = "";
                        res.on("data", (chunk) => (body += chunk)).on(
                            "end",
                            () => {
                                body.should.equal(
                                    `Method not allowed for ${path}`
                                );
                                resolve();
                            }
                        );
                    });
                }),
            ]).then(() => done());
        });

        it("it should only accept delete method requests", (done) => {
            const path = "/test/delete/method";

            Promise.all([
                new Promise((resolve, reject) => {
                    const req = http.request(
                        {
                            url: "http://locahost",
                            port: 8000,
                            path,
                            method: "DELETE",
                        },
                        (res) => {
                            res.statusCode.should.equal(200);

                            let body = "";
                            res.on("data", (chunk) => (body += chunk)).on(
                                "end",
                                () => {
                                    body.should.equal("test text");
                                    resolve();
                                }
                            );
                        }
                    );

                    req.on("error", (err) => {
                        throw err;
                    }).end();
                }),
                new Promise((resolve, reject) => {
                    http.get(`${SERVER_URL}${path}`, (res) => {
                        res.statusCode.should.equal(405);

                        let body = "";
                        res.on("data", (chunk) => (body += chunk)).on(
                            "end",
                            () => {
                                body.should.equal(
                                    `Method not allowed for ${path}`
                                );
                                resolve();
                            }
                        );
                    });
                }),
            ]).then(() => done());
        });
    });

    describe("Routes with a dot in them", () => {
        it('should be allowed to add routes like `addRoute("/README.md")`', (done) => {
            http.get(`${SERVER_URL}/README.md`, (res) => {
                res.statusCode.should.equal(200);
                let data = "";
                res.on("data", (chunk) => (data += chunk)).on("end", () => {
                    data.should.equal("README.md content");
                    done();
                });
            });
        });
    });

    describe("Tolerant route handling", () => {
        it("should ignore multiple slashes (e.g. http://localhost//) and return 200 status code", (done) => {
            http.get(`${SERVER_URL}//`, (res) => {
                res.statusCode.should.equal(200);
                done();
            });
        });
        it("should ignore various multiple slashes (e.g. http://localhost/////another//test) and return 200 status code", (done) => {
            http.get(`${SERVER_URL}//////another///test`, (res) => {
                res.statusCode.should.equal(200);
                done();
            });
        });
    });

    after(() => {
        router.close();
    });
});
