var DB = require('../lib/database.js');
var LoL = require('../lib/lol.js');
var logger = require('../lib/logger.js');
var settings = require('../lib/settings.js');
var Stats = require('../lib/statistics.js');

try {
  var db = new DB(settings.postgre_url);
  var lol = new LoL(settings.lol_api_key, settings.lol_burst_requests, settings.lol_burst_period);
  var stats = new Stats(db, lol);

  db.init().then(function() {
    return lol.init();
  }).then(function() {
    return lol.resetTempCache();
  }).then(function() {
    return stats.updateAllLeagues();
  }).then(function() {
    return lol.resetTempCache();
  }).fail(logger.logException).fin(function() {
    return db.deinit();
  }).fin(function() {
    return lol.deinit();
  }).fail(logger.logException).done();
} catch (err) {
  logger.logException(err);
}
