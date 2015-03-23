var http = require('http');

var express = require('express');

var app = express();

mlfPromise = require('./app.js');

mlfPromise.then(function(mlfApp) {
  app.use('/MLF', mlfApp);

  var server = http.createServer(app).listen(80, '127.0.0.1', function() {
    var host = server.address().address;
    var port = server.address().port;

    console.log('Server listening at http://%s:%s', host, port);
  });
}).done();
