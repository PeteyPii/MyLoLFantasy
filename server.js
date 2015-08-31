var fs = require('fs');
var http = require('http');
var https = require('https');
var path = require('path');

var express = require('express');

var mlf = require(path.join(__dirname, 'app.js'));
var settings = require(path.join(__dirname, 'settings.js'));

try {
  mlf.createApp(true).then(function(mlfApp) {
    var app = express();
    app.get('/', function(req, res) {
      res.redirect('/MLF');
    });
    app.use('/MLF', mlfApp);

    var httpsServer = https.createServer({
      key: fs.readFileSync(path.join(__dirname, 'certs/key.pem')),
      cert: fs.readFileSync(path.join(__dirname, 'certs/key-cert.pem')),
    }, app);

    httpsServer.listen(settings.server_https_port, function() {
      var host = httpsServer.address().address;
      var port = httpsServer.address().port;

      console.log('Server listening at https://%s:%s', host, port);
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

  }).fail(function(err) {
    if (err.stack) {
      console.error(err.stack);
    } else {
      console.error('Error: ' + err);
    }
  }).done();
} catch (err) {
  if (err.stack) {
    console.error(err.stack);
  } else {
    console.error('Error: ' + err);
  }
}
