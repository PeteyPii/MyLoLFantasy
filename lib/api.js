var express = require('express');

var router = express.Router();

router.use('/profile', function(req, res, next) {
  if (req.user) {
    res.send({
      isLoggedIn: true,
      username: req.user.username,
    });
  } else {
    res.send({
      isLoggedIn: false,
    });
  }
});

module.exports = router;
