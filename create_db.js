var fs = require('fs');
var path = require('path');

var _ = require('lodash');
var Q = require('q');

var dbApi = require(path.join(__dirname, 'database.js'));
var logger = require(path.join(__dirname, 'logger.js'));
var settings = require(path.join(__dirname, 'settings.js'));

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
