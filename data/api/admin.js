express = require('express');

router = express.Router();

router.get('/', function(req, res) {
  res.send('This is the API for administrative tasks such as shutting down the data server.');
});

router.get('/shutdown', function(req, res) {
  req.app.locals.shutdown();
  res.send('Server will shutdown shortly.');
});

module.exports = router;
