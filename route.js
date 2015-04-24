var bcrypt = require('bcrypt');
var express = require('express');
var passport = require('passport');
var Q = require('q');

var router = express.Router();

router.use(function logRequests(req, res, next) {
  console.log('MLF request at url:', req.url);

  next();
});

router.use(function setRenderData(req, res, next) {
  res.locals.baseUrl = req.baseUrl;
  res.locals.isLoggedIn = !!req.user;
  res.locals.user = req.user;

  next();
});

router.get('/', function(req, res) {
  res.render('home');
});

router.get('/Home', function(req, res) {
  res.render('home');
});

router.post('/SignUp', function(req, res) {
  var username = req.body.username;
  var password = req.body.password;
  var confirmPassword = req.body.confirmPassword;
  var email = req.body.email;
  var summonerName = req.body.summonerName;
  var acceptedAgreement = req.body.agree;

  try {
    if (!username || !password || !confirmPassword || !summonerName || !acceptedAgreement)
      throw true;
    if (password != confirmPassword)
      throw true;
    if (username.length > 128 || password.length > 1024 || email.length > 128)
      throw true;
    if (!acceptedAgreement)
      throw true;
  } catch (err) {
    res.status(400);
    res.send('Bad request');
    return;
  }

  function flashInputs() {
    if (username) {
      req.flash('signupUsername', username);
    }
    if (summonerName) {
      req.flash('signupSummonerName', summonerName);
    }
    if (email) {
      req.flash('signupEmail', email);
    }
  }

  req.app.locals.db.getUser(username).then(function(user) {
    if (!user.error) {
      req.flash('signupError', 'Username is taken');
      req.flash('signupNameTaken', true);
      flashInputs();
      res.send({
        success: false
      });
    } else {
      req.app.locals.lol.getSummonerId(summonerName).fail(function(err) {
        if (err.statusCode) {
          req.flash('signupError', 'Riot server ' + statusCode + '\'ed');
          flashInputs();
          res.send({
            success: false
          });
        } else {
          throw err;
        }
      }).done(function(id) {
        if (id === -1) {
          req.flash('signupError', 'Summoner does not exist');
          req.flash('signupSummonerNotExists', true);
          flashInputs();
          res.send({
            success: false
          });
        } else {
          return Q.ninvoke(bcrypt, 'hash', password, req.app.locals.settings.password_hash_rounds).then(function(hash) {
            return req.app.locals.db.createUser(username, hash, email, summonerName, 'na');
          }).then(function() {
            var user = {
              username: username
            };

            return Q.ninvoke(req, 'login', user);
          }).then(function() {
            res.send({
              success: true,
              url: req.baseUrl + '/Leagues'
            });
          });
        }
      });
    }
  }).done();
});

router.post('/LogIn', function(req, res) {
  var username = req.body.username;
  var password = req.body.password;

  try {
    if (!username || !password)
      throw true;
    if (username.length > 128 || password.length > 1024)
      throw true;
  } catch(err) {
    res.status(400);
    res.send('Bad request');
    return;
  }

  function flashInputs() {
    if (username) {
      req.flash('loginUsername', username);
    }
  }

  passport.authenticate('local', function(err, user, info) {
    if (err) {
      throw err;
    }

    if (!user) {
      req.flash('loginError', 'Invalid log in credentials');
      req.flash('loginMismatch', true);
      flashInputs();

      res.send({
        success: false
      });
    } else {
      Q.ninvoke(req, 'login', user).then(function() {
        res.send({
          success: true,
          url: req.baseUrl + '/Leagues'
        });
      }).done();
    }
  })(req, res);
});

router.post('/LogOut', function(req, res) {
  req.logout();
  res.send({
    success: true,
    url: req.baseUrl + '/'
  });
});

router.get('/Leagues', function(req, res) {
  if (!req.user) {
    redirectRequireLogin(req, res);
    return;
  }

  req.app.locals.db.getUsersLeagues(req.user.username).then(function (leagues) {
    res.locals.leagues = leagues;
    res.render('leagues');
  }).done();
});

module.exports = router;

function redirectRequireLogin(req, res) {
  req.flash('loginRequired', true);
  req.flash('loginError', 'You must be logged in to view that!');
  res.redirect(req.baseUrl + '/');
}
