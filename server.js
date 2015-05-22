var fs = require('fs');
var http = require('http');
var https = require('https');
var path = require('path');

var express = require('express');
var reload = require('reload');

var mlf = require(path.join(__dirname, 'app.js'));

try {
  mlf.createApp(true).then(function(mlfApp) {
    var app = express();
    app.get('/', function(req, res) {
      res.redirect('/MLF');
    });
    app.use('/MLF', mlfApp);

    var httpsServer = https.createServer({
      key: fs.readFileSync(path.join(__dirname, 'certs/server.key')),
      cert: fs.readFileSync(path.join(__dirname, 'certs/server.crt')),
      ca: fs.readFileSync(path.join(__dirname, 'certs/ca.crt')),
      requestCert: true,
      rejectUnauthorized: false
    }, app);

    reload(httpsServer, app, 1000);

    httpsServer.listen(443, '127.0.0.1', function() {
      var host = httpsServer.address().address;
      var port = httpsServer.address().port;

      console.log('Server listening at http://%s:%s', host, port);
    });

    // Create server for redirecting to the secure version of the app
    var redirectApp = express();
    redirectApp.get('*', function(req, res) {
      console.log('Redirecting to main site');
      res.redirect('https://' + req.hostname + req.url)
    });
    var httpServer = http.createServer(redirectApp).listen(80);

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
