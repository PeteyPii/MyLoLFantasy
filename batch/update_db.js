var Q = require('q');

var DB = require('../lib/database.js');
var logger = require('../lib/logger.js');
var LoL = require('../lib/lol.js');
var Redis = require('../lib/redis.js');

try {
  var db = new DB();
  var redis = new Redis();
  var lol = new LoL(redis);

  redis.init(true, true, true).then(function() {
    return lol.init();
  }).then(function() {
    return db.getVersion();
  }).then(function(version) {
    return db.updateDb(version, lol);
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
