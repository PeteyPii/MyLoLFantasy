var express = require('express');

var authRoute = require('./auth.js');
var leaguesRoute = require('./leagues.js');

var router = express.Router();

router.use(function noStore(req, res, next) {
  // API should not be cached.
  res.header('Cache-Control', 'no-store');
  next();
});

router.use(authRoute);
router.use(leaguesRoute);
router.all('*', function(req, res) {
  res.status(404);
  res.send('Not found');
});

module.exports = router;
