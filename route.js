var router = require('express').Router();

router.use(function setRenderData(req, res, next) {
  res.locals.baseUrl = req.baseUrl;
  res.locals.isLoggedIn = !!req.user;

  next();
});

router.get('/', function (req, res) {
  res.render('home');
});

module.exports = router;
