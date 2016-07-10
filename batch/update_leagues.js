var DB = require('../lib/database.js');
var logger = require('../lib/logger.js');
var LoL = require('../lib/lol.js');
var Stats = require('../lib/statistics.js');

try {
  var db = new DB();
  var lol = new LoL();
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
