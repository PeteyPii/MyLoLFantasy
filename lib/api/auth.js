var _ = require('lodash');
var bcrypt = require('bcrypt');
var express = require('express');
var passport = require('passport');
var Q = require('q');

var apiHelpers = require('./helpers.js');

var router = express.Router();

router.use('/Profile', function(req, res) {
  res.send(apiHelpers.createProfileData(req.user));
});

router.post('/LogIn', apiHelpers.verifyCsrfToken, function(req, res) {
  var username = req.body.username;
  var password = req.body.password;

  try {
    if (!_.isString(username) || !_.isString(password))
      throw true;
    if (!username || !password)
      throw true;
    if (username.length > 128 || password.length > 1024)
      throw true;
  } catch(err) {
    res.status(400);
    res.send('Bad request');
    return;
  }

  passport.authenticate('local', function(err, user, info) {
    if (err) {
      throw err;
    }

    if (!user) {
      var reason;
      switch (info.reason) {
        case 'throttled':
          reason = 'Too many failed log in attempts for this account or your IP address. This could be due to someone else on your network. Please wait some time before attempting to log in again.';
          break;
        case 'invalid':
          reason = 'Invalid log in credentials';
          break;
        default:
          reason = 'Invalid log in credentials';
          break;
      }
      res.send({
        success: false,
        reason: reason,
      });
    } else {
      Q.ninvoke(req, 'login', user).done(function() {
        res.send({
          success: true,
          profile: apiHelpers.createProfileData(user),
        });
        req.app.locals.redis.logInSuccess(req.ip, username).done();
      });
    }
  })(req, res);
});

router.post('/LogOut', apiHelpers.verifyCsrfToken, function(req, res) {
  req.logout();
  res.send({
    success: true,
    profile: apiHelpers.createProfileData(req.user),
  });
});

router.post('/SignUp', apiHelpers.verifyCsrfToken, function(req, res) {
  var username = req.body.username;
  var password = req.body.password;
  var confirmPassword = req.body.confirmPassword;
  var email = req.body.email;
  var summonerName = req.body.summonerName;
  var region = 'na';
  var acceptedAgreement = req.body.agree;

  try {
    if (!_.isString(username) || !_.isString(password) || !_.isString(confirmPassword) || !_.isString(email) || !_.isString(summonerName))
      throw true;
    if (!username || !password || !confirmPassword || !summonerName)
      throw true;
    if (password !== confirmPassword)
      throw true;
    if (username.length > 128 || password.length > 1024 || email.length > 128 || summonerName.length > 128)
      throw true;
    if (!acceptedAgreement)
      throw true;
  } catch (err) {
    res.status(400);
    res.send('Bad request');
    return;
  }

  var error = '';

  req.app.locals.redis.signUpAllowed(req.ip).then(function(allowed) {
    if (!allowed) {
      error = 'Sign up denied because we have detected too many sign ups coming from your IP address. This could be due to someone else on your network. Please wait some time before attempting to sign up again.';
      throw error;
    }
    return req.app.locals.db.getUser(username);
  }).then(function(user) {
    if (user) {
      error = 'Username is taken';
      throw error;
    } else {
      return req.app.locals.lol.getSummonerId(region, summonerName).fail(function(err) {
        if (err.status) {
          error = 'Riot server ' + err.status + '\'ed';
        }

        throw err;
      });
    }
  }).then(function(id) {
    if (id === -1) {
      error = 'Summoner does not exist';
      throw error;
    }

    return Q.ninvoke(bcrypt, 'hash', password, req.app.locals.settings.password_hash_rounds);
  }).then(function(hash) {
    return req.app.locals.db.createUser(username, hash, email, summonerName, region);
  }).then(function() {
    var user = {
      username: username,
      region: region,
      summonerName: summonerName,
    };

    return Q.ninvoke(req, 'login', user);
  }).then(function() {
    res.send({
      success: true,
      profile: apiHelpers.createProfileData(req.user),
    });
  }).fail(function(reason) {
    reason = error || 'Unknown error...';
    res.send({
      success: false,
      reason: reason,
    });
  }).done();
});


module.exports = router;
