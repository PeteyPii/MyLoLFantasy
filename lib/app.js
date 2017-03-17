var crypto = require('crypto');
var path = require('path');

var bcrypt = require('bcrypt');
var bodyParser = require('body-parser');
var compress = require('compression');
var connectRedis = require('connect-redis');
var cookieParser = require('cookie-parser');
var express = require('express');
var favicon = require('serve-favicon');
var LocalStrat = require('passport-local');
var nodemailer = require('nodemailer');
var passport = require('passport');
var Q = require('q');
var serveStatic = require('serve-static');
var session = require('express-session');

var apiRoute = require('./api/root.js');
var DB = require('./database.js');
var logger = require('./logger.js');
var LoL = require('./lol.js');
var Redis = require('./redis.js');
var settings = require('./settings.js');
var Stats = require('./statistics.js');

module.exports = {
  createApp: function() {
    var db = new DB();
    var redis = new Redis();
    var lol = new LoL(redis);
    var stats = new Stats(db, lol);

    var promise = db.init().then(function() {
      return redis.init(true, true, true);
    }).then(function() {
      return lol.init();
    }).then(function() {
      var app = express();
      var RedisStore = connectRedis(session);

      app.use(serveStatic(path.join(__dirname, '../public'), {
        redirect: false,
        maxAge: settings.is_prod ? settings.asset_cache_time : 0,
      }));
      app.use(favicon(path.join(__dirname, '../public/imgs/favicon.ico'), {
        maxAge: settings.is_prod ? settings.asset_cache_time : 0,
      }));
      app.use(bodyParser.json());
      app.use(bodyParser.urlencoded({
        extended: true,
      }));
      app.use(cookieParser(settings.secret_key, {
        secure: settings.is_prod,
        maxAge: settings.cookie_age,
      }));
      app.use(session({
        secret: settings.secret_key,
        resave: false,
        saveUninitialized: true,
        store: new RedisStore({
          host: settings.redis_host,
          port: settings.redis_port
        }),
        rolling: true,
        cookie: {
          secure: settings.is_prod,
          maxAge: settings.cookie_age,
        },
      }));
      app.use(passport.initialize());
      app.use(passport.session());
      app.use(compress());

      passport.use(new LocalStrat({
        passReqToCallback: true,
      }, function(req, username, password, done) {
        redis.logInAllowed(req.ip, username).done(function(allowed) {
          if (!allowed) {
            done(null, false, {
              reason: 'throttled',
            });
          } else {
            db.getUser(username).done(function(user) {
              if (!user) {
                done(null, false, {
                  reason: 'invalid',
                });
              } else {
                Q.ninvoke(bcrypt, 'compare', password, user.password_hash).done(function(result) {
                  if (!result) {
                    done(null, false, {
                      reason: 'invalid',
                    });
                  } else {
                    done(null, {
                      username: user.username,
                      region: user.region,
                      summonerName: user.summoner_name
                    });
                  }
                });
              }
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

      app.use('/api', apiRoute);

      app.use('*', function(req, res) {
        var token = crypto.randomBytes(16);
        token = token.toString('base64').replace(/=/g, '');
        res.header('Set-Cookie', 'csrf=' + token + ';Path=/' + (settings.is_prod ? ';Secure' : ''));
        res.header('Cache-Control', 'no-cache,private');
        res.sendFile('index.html', {
          root: path.join(__dirname, '../public'),
        });
      });

      app.set('trust proxy', 'loopback');

      app.locals.db = db;
      app.locals.redis = redis;
      app.locals.lol = lol;
      app.locals.stats = stats;
      app.locals.emailer = nodemailer.createTransport(settings.email_url);

      return app;
    });

    return promise;
  }
};
