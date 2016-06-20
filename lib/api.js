var _ = require('lodash');
var bcrypt = require('bcrypt');
var express = require('express');
var passport = require('passport');
var Q = require('q');

var router = express.Router();

function createProfileData(user) {
  if (user) {
    return {
      isLoggedIn: true,
      username: user.username,
    };
  } else {
    return {
      isLoggedIn: false,
    };
  }
}

router.use('/Profile', function(req, res, next) {
  if (req.user) {
    res.send(createProfileData(req.user));
  } else {
    res.send(createProfileData(req.user));
  }
});

router.post('/SignUp', function(req, res) {
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

  req.app.locals.db.getUser(username).then(function(user) {
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
    };

    return Q.ninvoke(req, 'login', user);
  }).then(function() {
    res.send({
      success: true,
      profile: createProfileData(req.user),
    });
  }).fail(function(reason) {
    reason = error || 'Unknown error...';
    res.send({
      success: false,
      reason: reason,
    });
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

  passport.authenticate('local', function(err, user, info) {
    if (err) {
      throw err;
    }

    if (!user) {
      res.send({
        success: false,
        reason: 'Invalid log in credentials',
      });
    } else {
      Q.ninvoke(req, 'login', user).done(function() {
        res.send({
          success: true,
          profile: createProfileData(user),
        });
      });
    }
  })(req, res);
});

router.post('/LogOut', function(req, res) {
  req.logout();
  res.send({
    success: true,
    profile: createProfileData(req.user),
  });
});

module.exports = router;
