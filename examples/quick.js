var http = require("http");
var router = require("../index")(http);

router.addRoute("/", function (req, res, url) {
    // Standard route
    res.writeHead(200, { "Content-Type": "text/html" });
    res.end("Test Response");
});

router.addRoute("/test/:param([a-z]+)", function (req, res, url) {
    // Route with url parameter
    var param = req.parameters.param;

    res.writeHead(200, { "Content-Text": "text/html" });
    res.end("Parameter value: " + param);
});

router.listen(3000, function () {
    // Set port for router/server to listen to
    console.log("Server listening on port 3000");
});
