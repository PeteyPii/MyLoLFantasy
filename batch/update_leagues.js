var DB = require('../lib/database.js');
var logger = require('../lib/logger.js');
var LoL = require('../lib/lol.js');
var Redis = require('../lib/redis.js');
var Stats = require('../lib/statistics.js');

try {
  var db = new DB();
  var redis = new Redis();
  var lol = new LoL(redis);
  var stats = new Stats(db, lol);

  db.init().then(function() {
    return redis.init(false, true, false);
  }).then(function() {
    return lol.init();
  }).then(function() {
    return stats.updateAllLeagues();
  }).fail(logger.logException).fin(function() {
    return db.deinit();
  }).fin(function() {
    return lol.deinit();
  }).fin(function() {
    return redis.deinit();
  }).fail(logger.logException).done();
} catch (err) {
  logger.logException(err);
}
