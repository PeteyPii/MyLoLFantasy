var fs = require('fs');

var _ = require('lodash');
var Q = require('q');

var dbApi = require('./database.js');
var logger = require('./logger.js');
var settings = require('./settings.js');

try {
  var db = new dbApi(settings.postgre_url);

  db.createDb().fail(function(err) {
    if (err.stack) {
      logger.error(err.stack);
    } else {
      logger.error('Error: ' + err)
    }
  }).fin(function() {
    db.deinit();
  }).done();
} catch (err) {
  if (err.stack) {
    logger.error(err.stack);
  } else {
    logger.error('Error: ' + err)
  }
}
