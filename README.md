# node-small-router
Small router module for nodejs that allow allows users to execute callback code on a named route with or without parameters and query strings.

Dropped support for versions of node under 8.0 due to security issues with dependencies spotted by npm audit

[![npm version](https://badge.fury.io/js/small-router.svg)](https://badge.fury.io/js/small-router)
[![Build Status](https://travis-ci.org/SC7639/node-small-router.svg?branch=master)](https://travis-ci.org/SC7639/node-small-router)

# Installation
    npm install small-router

# Quick Example
```javascript
var http = require('http');
var router = require('small-router')(http);

router.addRoute('/', function(req, res, url) { // Standard route
  res.writeHead(200, { 'Content-Type': 'text/html' });
  res.end("Test Response");
});

router.addRoute('/test/:param([a-z]+)', function(req, res, url) { // Route with url parameter
  var param = req.parameters.param;

  res.writeHead(200, { 'Content-Text': 'text/html' });
  res.end('Parameter value: ' + param);
});

router.get('/test/get/method', function(req, res, url) { // Route that only accepts get requests

    res.writeHead(200, { 'Content-Type': 'text/html' });
    res.end('Test get method only');
});

router.post('/test/get/method', function(req, res, url) { // Route that only accepts post requests

    res.writeHead(200, { 'Content-Type': 'text/html' });
    res;.end('Test post method only');
});

router.put('/test/put/method', function(req, res, url) { // Route that only accepts put requests

    res.writeHead(200, { 'Content-Type': 'text/html' });
    res.end('Test put method only');
});

router.delete('/test/delete/method', function(req, res, url) { // Route that only accepts delete requests

    res.writeHead(200, { 'Content-Type': 'text/html' });
    res.end('Test delete method only');
});

router.listen(3000, function() { // Set port for router/server to listen to
  console.log("Server listening on port 3000");
});
```
  
  




