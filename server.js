var http = require('http');

var express = require('express');
var reload = require('reload');

var app = express();

mlf = require('./app.js');

try {
  mlf.createApp().then(function(mlfApp) {
    app.get('/', function(req, res) {
      res.redirect('/MLF');
    });
    app.use('/MLF', mlfApp);

    var server = http.createServer(app);

    reload(server, app, 1000);

    server.listen(80, '127.0.0.1', function() {
      var host = server.address().address;
      var port = server.address().port;

      console.log('Server listening at http://%s:%s', host, port);
    });
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
