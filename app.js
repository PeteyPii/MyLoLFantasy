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

var dbApi = require(path.join(__dirname, 'database.js'));
var lolApi = require(path.join(__dirname, 'lol.js'));
var statsApi = require(path.join(__dirname, 'statistics.js'));

var VERSION = '0.0.1';
var settings = {};

module.exports = {
  createApp: function(gatherStats) {
    settings = _.assign(settings, require(path.join(__dirname, 'defaults.json')), require(path.join(__dirname, 'settings.json')));

    validateSettings(settings);

    var db = new dbApi(settings.postgre_url);
    var lol = new lolApi(settings.lol_api_key, settings.lol_burst_requests, settings.lol_burst_period);

    var promise = db.init().then(function() {
      return lol.init();
    }).then(function() {
      file.walkSync(path.join(__dirname, 'less'), function(dirPath, dirs, files) {
        for (var i = 0; i < files.length; i++) {
          var filePath = path.join(dirPath, files[i]);
          less.render(fs.readFileSync(filePath).toString('utf8'), {
            paths: [path.join(__dirname, 'less')],
            filename: filePath,
            compress: false
          }, function(err, output) {
            if (err) {
              throw err;
            }

            var outFileName = path.join(__dirname, 'public/css', path.basename(files[i], '.less') + '.css');
            fs.writeFileSync(outFileName, output.css);
          });
        }
      });
    }).then(function() {
      var app = express();

      app.set('views', path.join(__dirname, 'views'));
      app.set('view engine', 'jade');

      app.use(express.static(path.join(__dirname, 'public')));
      app.use(favicon(path.join(__dirname, 'public/img/favicon.ico')));
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
          if (!user) {
            return done(null, false);
          } else {
            Q.ninvoke(bcrypt, 'compare', password, user.password_hash).then(function(result) {
              return done(null, !result ? false : {
                username: user.username,
                region: user.region,
                summonerName: user.summoner_name
              });
            });
          }
        });
      }));

      passport.serializeUser(function(user, done) {
        done(null, user.username);
      });

      passport.deserializeUser(function(username, done) {
        db.getUser(username).done(function(user) {
          if (!user) {
            done(null, false);
          } else {
            done(null, {
              username: username,
              region: user.region,
              summonerName: user.summoner_name
            });
          }
        });
      });

      app.use('/', require(path.join(__dirname, 'route.js')));

      app.locals.settings = settings;
      app.locals.db = db;
      app.locals.lol = lol;

      if (gatherStats) {
        var stats = new statsApi(db, lol);
        var lastUpdateTime = 0;

        function updateLeagues() {
          lastUpdateTime = (new Date()).getTime();
          stats.updateAllLeagues().fail(function(err) {
            if (err.stack) {
              console.error('Error while updating all Leagues');
              console.error(err.stack);
            } else {
              console.error('Error updating all Leagues: ' + err);
            }
          }).done(function() {
            setTimeout(updateLeagues, Math.max(0, settings.refresh_period - ((new Date()).getTime() - lastUpdateTime)));
          });
        }

        updateLeagues();
        app.locals.stats = stats;
      }

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
