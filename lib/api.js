var express = require('express');
var passport = require('passport');

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

module.exports = router;
