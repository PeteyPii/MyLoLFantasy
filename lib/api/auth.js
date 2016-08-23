var crypto = require('crypto');

var _ = require('lodash');
var bcrypt = require('bcrypt');
var express = require('express');
var passport = require('passport');
var Q = require('q');

var apiHelpers = require('./helpers.js');
var logger = require('../logger.js');
var settings = require('../settings.js');

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

    return Q.ninvoke(bcrypt, 'hash', password, settings.password_hash_rounds);
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

router.post('/ResetPassword', apiHelpers.verifyCsrfToken, function(req, res) {
  var username = req.body.username;
  if (!_.isString(username) || !username || username.length > 128 || req.user) {
    res.status(400);
    res.send('Bad request');
    return;
  }

  var error = '';
  req.app.locals.redis.resetPasswordAllowed(req.ip, username).then(function(allowed) {
    if (!allowed) {
      error = 'Password reset link not emailed since this account is experiencing too many password reset requests or because your IP has requested too many password resets. This may be due to someone else on your network. Please wait some time before attempting to reset your password again.';
      throw error;
    }

    return req.app.locals.db.getUser(username);
  }).then(function(user) {
    if (user) {
      var token = crypto.randomBytes(32);
      token = token.toString('hex');
      return req.app.locals.redis.createResetPasswordToken(username, token).then(function() {
        if (user.email) {
          var link = 'https://' + req.hostname + settings.base_path + 'ResetPassword/' + token;
          var emailSubject = 'My LoL Fantasy Account Password Reset';
          var emailBody = 'Follow the link below to update your password for your My LoL Fantasy account "' + username + '". ' +
            'If this account does not belong to you or you believe you have received this email in error, please ignore it and delete it from your inbox.<br>' +
            '<a href="' + link + '">' + link + '</a>';
          var mailOptions = {
            to: user.email,
            subject: emailSubject,
            html: emailBody,
          };
          return Q.ninvoke(req.app.locals.emailer, 'sendMail', mailOptions).fail(function(reason) {
            // We don't care about email sending failures since the user's email may just
            // be invalid. The server may also not be configured to send emails which is also
            // good to ignore for dev purposes.
          });
        }
      });
    }
  }).then(function() {
    res.send({
      success: true,
    });
  }).fail(function(reason) {
    reason = error || 'Unknown error...';
    res.send({
      success: false,
      reason: reason,
    });
  }).done();
});

router.get('/ResetPassword/:token', function(req, res) {
  var token = req.params.token;
  req.app.locals.redis.resetPasswordTokenExists(token).then(function(exists) {
    if (!exists) {
      res.status(404);
      res.send('Not found');
    } else {
      res.send({});
    }
  }).fail(function(reason) {
    res.status(500);
    res.send('Server error');
  }).done();
});

router.post('/ResetPassword/:token', apiHelpers.verifyCsrfToken, function(req, res) {
  var token = req.params.token;
  var password = req.body.password;
  if (!_.isString(password) || !password || password.length > 128 || req.user) {
    res.status(400);
    res.send('Bad request');
    return;
  }

  var error = '';
  req.app.locals.redis.consumeResetPasswordToken(token).then(function(username) {
    if (username === null) {
      error = 'Invalid password reset token.';
      throw error;
    }

    return Q.ninvoke(bcrypt, 'hash', password, settings.password_hash_rounds).then(function(hash) {
      return req.app.locals.db.updateUserPassword(username, hash);
    });
  }).then(function() {
    res.send({
      success: true,
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
