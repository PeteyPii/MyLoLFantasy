var fs = require('fs');
var path = require('path');

var bodyParser = require('body-parser');
var bcrypt = require('bcrypt');
var compress = require('compression');
var connectRedis = require('connect-redis');
var express = require('express');
var flash = require('express-flash');
var session = require('express-session');
var file = require('file');
var less = require('less');
var _ = require('lodash');
var passport = require('passport');
var localStrat = require('passport-local');
var Q = require('q');
var redis = require('redis');
var favicon = require('serve-favicon');

var dbApi = require(path.join(__dirname, 'database.js'));
var logger = require(path.join(__dirname, 'logger.js'));
var lolApi = require(path.join(__dirname, 'lol.js'));
var settings = require(path.join(__dirname, 'settings.js'));
var statsApi = require(path.join(__dirname, 'statistics.js'));

var VERSION = '1.0.3';

module.exports = {
  createApp: function(gatherStats) {
    var db = new dbApi(settings.postgre_url);
    var lol = new lolApi(settings.lol_api_key, settings.lol_burst_requests, settings.lol_burst_period);
    var stats = new statsApi(db, lol);

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
      var redisStore = connectRedis(session);

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
        store: new redisStore({
          host: 'localhost',
          port: '6379'
        }),
        rolling: true,
        cookie: {
          secure: true,
          maxAge: settings.cookie_age,
        },
      }));
      app.use(flash());
      app.use(passport.initialize());
      app.use(passport.session());
      app.use(compress());

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
      app.locals.stats = stats;

      if (gatherStats) {
        var lastUpdateTime = 0;

        function updateLeagues() {
          lastUpdateTime = (new Date()).getTime();
          lol.resetTempCache().then(function() {
            return stats.updateAllLeagues();
          }).then(function() {
            return lol.resetTempCache();
          }).fail(function(err) {
            if (err.stack) {
              logger.error('Error while updating all Leagues');
              logger.error(err.stack);
            } else {
              logger.error('Error updating all Leagues: ' + err);
            }
          }).done(function() {
            setTimeout(updateLeagues, Math.max(0, settings.refresh_period - ((new Date()).getTime() - lastUpdateTime)));
          });
        }

        // Wait 5 seconds to start updating leagues so that things don't get hairy in the middle of starting up
        setTimeout(updateLeagues, 5000);
      }

      return app;
    });

    return promise;
  }
};
