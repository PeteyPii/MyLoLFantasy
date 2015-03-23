var fs = require('fs');
var http = require('http');

var _ = require('lodash');
var express = require('express');
var favicon = require('serve-favicon');
var session = require('express-session');
var flash = require('express-flash');
var passport = require('passport');

var db = require('./database.js');

var VERSION = '0.0.1';

var promise = 'hello';

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

  validateSettings(settings);

  promise = db.init(settings.postgre_url).then(function() {
    var app = express();

    app.set('views', './views');
    app.set('view engine', 'jade');

    app.use(express.static('public'));
    app.use(favicon('./public/img/favicon.ico'));
    app.use(session({
      secret: settings.secret_key,
      resave: false,
      saveUninitialized: true,
    }));
    app.use(flash());
    app.use(passport.initialize());
    app.use(passport.session());

    app.use('/', require('./route.js'));

    app.locals.settings = settings;
    app.locals.db = db;

    return app;

  }).fail(function(err) {
    console.log('Error: ' + err);
  }).fin(function() {
    db.deinit();
  });
} catch (err) {
  console.log('Error: ' + err);
}

module.exports = promise;

function validateSettings(settings) {
  var requiredSettings = [
    'lol_api_key',
    'refresh_period',
    'postgre_url',
    'secret_key'
  ];

  for (var i = 0; i < requiredSettings.length; i++) {
    if (typeof settings[requiredSettings[i]] == 'undefined')
      throw 'Missing setting \'' + requiredSettings[i] + '\'';
  }

  if (!_.isString(settings.lol_api_key) || !settings.lol_api_key.match(/^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i))
    throw 'LoL API key looks incorrect. Should look like\n' +
          'XXXXXXXX-XXXX-XXXX-XXXX-XXXXXXXXXXXX rather than yours which is\n' +
          settings.lol_api_key;
  if (!_.isFinite(settings.refresh_period) || settings.refresh_period < 0)
    throw 'Refresh period needs to be a non-negative number';
  if (!_.isString(settings.postgre_url))
    throw 'PostgreSQL URL must be a string';
  if (!_.isString(settings.secret_key))
    throw 'Secret key must be a string (and it should be very random!)';
}
