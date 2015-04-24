var fs = require('fs');
var path = require('path');

var _ = require('lodash');
var bodyParser = require('body-parser');
var bcrypt = require('bcrypt');
var express = require('express');
var flash = require('express-flash');
var session = require('express-session');
var file = require('file');
var less = require('less');
var passport = require('passport');
var localStrat = require('passport-local');
var Q = require('q');
var favicon = require('serve-favicon');

var dbApi = require('./database.js');
var lolApi = require('./lol.js');

var VERSION = '0.0.1';
var settings = {};

module.exports = {
  createApp: function() {
    settings = _.assign(settings, require('./defaults.json'), require('./settings.json'));

    validateSettings(settings);

    var db = new dbApi(settings.postgre_url);
    var lol = new lolApi(settings.lol_api_key, settings.lol_burst_requests, settings.lol_burst_period);

    var promise = db.init().then(function() {
      return lol.init();
    }).then(function() {
      file.walkSync('less', function(dirPath, dirs, files) {
        for (var i = 0; i < files.length; i++) {
          var filePath = path.join(dirPath, files[i]);
          less.render(fs.readFileSync(filePath).toString('utf8'), {
            paths: ['less'],
            filename: filePath,
            compress: false
          }, function(err, output) {
            if (err) {
              throw err;
            }

            var outFileName = path.join('public/css',
              dirPath.split(path.sep).slice(1).join(path.sep),
              path.basename(files[i], '.less') + '.css');
            fs.writeFileSync(outFileName, output.css);
          });
        }
      });
    }).then(function() {
      var app = express();

      app.set('views', './views');
      app.set('view engine', 'jade');

      app.use(express.static('public'));
      app.use(favicon('./public/img/favicon.ico'));
      app.use(bodyParser.json());
      app.use(bodyParser.urlencoded({
        extended: true,
      }));
      app.use(session({
        secret: settings.secret_key,
        resave: false,
        saveUninitialized: true,
      }));
      app.use(flash());
      app.use(passport.initialize());
      app.use(passport.session());

      passport.use(new localStrat(function(username, password, done) {
        db.getUser(username).done(function(user) {
          if (user.error) {
            return done(null, false);
          } else {
            Q.ninvoke(bcrypt, 'compare', password, user.password_hash).then(function(result) {
              return done(null, !result ? false : {
                username: user.username
              });
            });
          }
        });
      }));

      passport.serializeUser(function(user, done) {
        done(null, user.username);
      });

      passport.deserializeUser(function(username, done) {
        done(null, {
          username: username
        });
      });

      app.use('/', require('./route.js'));

      app.locals.settings = settings;
      app.locals.db = db;
      app.locals.lol = lol;

      return app;
    });

    return promise;
  }
};

function validateSettings(settings) {
  var requiredSettings = [
    'lol_api_key',
    'refresh_period',
    'postgre_url',
    'secret_key',
    'lol_burst_requests',
    'lol_burst_period',
    'password_hash_rounds'
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
  if (!_.isFinite(settings.lol_burst_requests) || (settings.lol_burst_requests !== settings.lol_burst_requests | 0) || settings.lol_burst_requests <= 0)
    throw 'Number of LoL burst requests should be a positive integer';
  if (!_.isFinite(settings.lol_burst_period) || (settings.lol_burst_period !== settings.lol_burst_period | 0) || settings.lol_burst_period < 0)
    throw 'LoL burst request period must be a a non-negative integer';
  if (!_.isFinite(settings.password_hash_rounds) || (settings.password_hash_rounds !== settings.password_hash_rounds | 0) || settings.password_hash_rounds < 1)
    throw 'Password hash rounds must be an integer greater than zero';
}
