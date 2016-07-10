var path = require('path');

var bodyParser = require('body-parser');
var bcrypt = require('bcrypt');
var compress = require('compression');
var connectRedis = require('connect-redis');
var express = require('express');
var session = require('express-session');
var passport = require('passport');
var LocalStrat = require('passport-local');
var Q = require('q');
var favicon = require('serve-favicon');

var DB = require('./database.js');
var logger = require('./logger.js');
var LoL = require('./lol.js');
var route = require('./route.js');
var settings = require('./settings.js');
var Stats = require('./statistics.js');

module.exports = {
  createApp: function() {
    var db = new DB(settings.postgre_url);
    var lol = new LoL(settings.lol_api_key, settings.lol_burst_requests, settings.lol_burst_period);
    var stats = new Stats(db, lol);

    var promise = db.init().then(function() {
      return lol.init();
    }).then(function() {
      var app = express();
      var RedisStore = connectRedis(session);

      app.use(express.static(path.join(__dirname, '../public')));
      app.use(favicon(path.join(__dirname, '../public/imgs/favicon.ico')));
      app.use(bodyParser.json());
      app.use(bodyParser.urlencoded({
        extended: true,
      }));
      app.use(session({
        secret: settings.secret_key,
        resave: false,
        saveUninitialized: true,
        store: new RedisStore({
          host: 'localhost',
          port: '6379'
        }),
        rolling: true,
        cookie: {
          secure: true,
          maxAge: settings.cookie_age,
        },
      }));
      app.use(passport.initialize());
      app.use(passport.session());
      app.use(compress());

      passport.use(new LocalStrat(function(username, password, done) {
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
              summonerName: user.summoner_name,
            });
          }
        });
      });

      app.use(route);

      app.use('*', function(req, res) {
        res.sendFile('index.html', {
          root: path.join(__dirname, '../public'),
        });
      });

      app.locals.settings = settings;
      app.locals.db = db;
      app.locals.lol = lol;
      app.locals.stats = stats;

      return app;
    });

    return promise;
  }
};
