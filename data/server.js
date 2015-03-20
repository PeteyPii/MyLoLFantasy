var fs = require('fs');
var url = require('url');
var http = require('http');

var _ = require('lodash');
var Q = require('q');
var express = require('express');

var db = require('./database.js');

var VERSION = '0.0.1';

try {
  var settings = {};

  try {
    var data = fs.readFileSync('defaults.json');
    settings = _.assign(settings, JSON.parse(data));
  } catch (err) {
    // We don't care if the file doesn't exist since the user might define everything
    // in the user defined settings file.
  }

  try {
    var data = fs.readFileSync('settings.json');
    settings = _.assign(settings, JSON.parse(data));
  } catch (err) {
    // We don't care if the file doesn't exist since the user might define everything
    // in the default settings file.
  }

  var requiredSettings = [
    'lol_api_key',
    'refresh_period',
    'port',
    'keep_alive_timeout',
    'postgre_url'
  ];

  // Check for existence of all required settings
  for (var i = 0; i < requiredSettings.length; i++) {
    if (typeof settings[requiredSettings[i]] == 'undefined')
      throw 'Missing setting \'' + requiredSettings[i] + '\'';
  }

  // Check values of all settings
  if (!_.isString(settings.lol_api_key) || !settings.lol_api_key.match(/^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i))
    throw 'LoL API key looks incorrect. Should look like\n' +
          'XXXXXXXX-XXXX-XXXX-XXXX-XXXXXXXXXXXX rather than yours which is\n' +
          settings.lol_api_key;
  if (!_.isFinite(settings.refresh_period) || settings.refresh_period < 0)
    throw 'Refresh period needs to be a non-negative number';
  if (!_.isFinite(settings.keep_alive_timeout) || settings.refresh_period <= 0)
    throw 'Keep alive timeout needs to be a postive number';
  if (!_.isFinite(settings.port) || settings.port != (settings.port | 0) || settings.port >= 65536 || settings.port < 0)
    throw 'Port must be a non-negative integer below 65536';
  if (!_.isString(settings.postgre_url))
    throw "PostgreSQL URL must be string";

  db.init(settings.postgre_url).then(function() {
    var app = express();
    var server;

    app.locals.settings = settings;
    app.locals.shutdown = function() {
      server.close(function(err) {
        if (err) {
          throw err;
          return;
        }

        console.log('Data server shutdown successfully');
      });
      console.log('Data server shutting down...');
    };
    app.locals.db = db;

    app.get('/', function(req, res) {
      res.send('Server for the data tasks of MyLoLFantasy.');
    });

    app.get('/version', function(req, res) {
      res.send({version: VERSION});
    });

    var adminHandler = require('./api/admin.js');
    // var usersHandler = require('./api/users.js');
    // var groupsHandler = require('./api/groups.js');

    app.use('/admin', adminHandler);
    // app.use('/users', usersHandler);
    // app.use('/groups', groupsHandler);

    server = http.createServer(app).listen(settings.port, '127.0.0.1', function() {
      var host = server.address().address;
      var port = server.address().port;

      console.log('Data server listening at http://%s:%s', host, port);
      console.log('Data server started up successfully');
    });
    server.addListener('connection', function(stream) {
      stream.setTimeout(settings.keep_alive_timeout);
    });
  }).fail(function(err) {
    console.log('Error: ' + err);
  }).fin(function() {
    db.deinit();
  }).done();
} catch (err) {
  console.log('Error: ' + err);
}
