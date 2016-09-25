var fs = require('fs');
var http = require('http');

var express = require('express');

var mlf = require('./lib/app.js');
var logger = require('./lib/logger.js');
var settings = require('./lib/settings.js');

try {
  mlf.createApp().then(function(mlfApp) {
    var app = express();

    // Log all requests to the server
    app.use(function logRequests(req, res, next) {
      logger.logRequest(req);
      next();
    });

    app.get('/', function(req, res) {
      res.redirect(settings.base_path);
    });
    app.use(settings.base_path, mlfApp);

    var httpServer = http.createServer(app).listen(settings.server_port, function() {
      var host = httpServer.address().address;
      var port = httpServer.address().port;
      logger.log('Server listening at http://' + host + ':' + port);
    });
  }).fail(logger.logException).done();
} catch (err) {
  logger.logException(err);
}
