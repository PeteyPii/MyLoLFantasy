var fs = require('fs');
var http = require('http');
var https = require('https');
var path = require('path');

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

    var httpsServer = https.createServer({
      key: fs.readFileSync(path.join(__dirname, 'certs', settings.ssl_key_path)),
      cert: fs.readFileSync(path.join(__dirname, 'certs', settings.ssl_cert_path)),
    }, app);

    httpsServer.listen(settings.server_https_port, function() {
      var host = httpsServer.address().address;
      var port = httpsServer.address().port;

      logger.log('Server listening at https://' + host + ':' + port);
    });

    // Create server for redirecting to the secure version of the app
    var redirectApp = express();
    redirectApp.get('*', function(req, res) {
      if (settings.redirect_default_port) {
        res.redirect('https://' + req.hostname + req.url);
      } else {
        res.redirect('https://' + req.hostname + ':' + settings.server_https_port + req.url);
      }
    });
    var httpServer = http.createServer(redirectApp).listen(settings.server_http_port);
  }).fail(logger.logException).done();
} catch (err) {
  logger.logException(err);
}
