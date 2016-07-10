var dbApi = require('../lib/database.js');
var lolApi = require('../lib/lol.js');
var logger = require('../lib/logger.js');
var settings = require('../lib/settings.js');
var statsApi = require('../lib/statistics.js');

try {
  var db = new dbApi(settings.postgre_url);
  var lol = new lolApi(settings.lol_api_key, settings.lol_burst_requests, settings.lol_burst_period);
  var stats = new statsApi(db, lol);

  db.init().then(function() {
    return lol.init();
  }).then(function() {
    return lol.resetTempCache();
  }).then(function() {
    return stats.updateAllLeagues();
  }).then(function() {
    return lol.resetTempCache();
  }).fail(function(err) {
    if (err.stack) {
      logger.error(err.stack);
    } else {
      logger.error('Error: ' + err);
    }
  }).fin(function() {
    return db.deinit();
  }).fin(function() {
    return lol.deinit();
  }).done();
} catch (err) {
  if (err.stack) {
    logger.error(err.stack);
  } else {
    logger.error('Error: ' + err)
  }
}
