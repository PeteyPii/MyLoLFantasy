var Q = require('q');
var redis = require('redis');

var settings = require('./settings.js');

var REDIS_NAMESPACE = 'mlf:';

var REQUEST_LIST_KEY = REDIS_NAMESPACE + 'request_times';
var TEMP_DATA_KEY = REDIS_NAMESPACE + 'temp_data';
var PERM_DATA_KEY = REDIS_NAMESPACE + 'perm_data';
var SIGN_UP_COUNT_KEY = REDIS_NAMESPACE + 'sign_up_counts';
var LOG_IN_COUNT_KEY = REDIS_NAMESPACE + 'log_in_counts';
var LEAGUE_CREATION_COUNT_KEY = REDIS_NAMESPACE + 'league_creation_counts';

var IP_PREFIX = 'ip:';
var USER_PREFIX = 'user:';

// Usage: 'EVAL <the_script> 1 mlf:request_times <current_time> <min_wait>'
// Returns: Time to wait.
// Note: All times in ms.
var ATOMIC_DELAY_SCRIPT =
  'local oldestTime = redis.call(\'lpop\', KEYS[1]);' +
  'local waitTime = math.max(0, ARGV[2] - (ARGV[1] - oldestTime));' +
  'redis.call(\'rpush\', KEYS[1], ARGV[1] + waitTime);' +
  'return waitTime;';

// Usage: 'EVAL <the_script> 1 <type> <id> <period>'
// Returns: Number of ticks for the given identifier in recent-most period.
// Note: Time is in ms.
var ATOMIC_THROTTLE =
  'local existed = redis.call(\'exists\', KEYS[1]);' +
  'local count = redis.call(\'hincrby\', KEYS[1], ARGV[1], 1);' +
  'if existed == 0 then ' +
  '  redis.call(\'pexpire\', KEYS[1], ARGV[2]);' +
  'end ' +
  'return count;';

// Usage: 'EVAL <the_script> 1 <type> <id>'
// Returns: Nothing. Just unticks the effect of the above script.
var ATOMIC_THROTTLE_UNDO =
  'local existed = redis.call(\'exists\', KEYS[1]);' +
  'if existed == 1 then ' +
  '  redis.call(\'hincrby\', KEYS[1], ARGV[1], -1);' +
  'end';

// All methods return Q promises.
function Redis() {
  var self = this;

  self.client = redis.createClient({
    host: settings.redis_host,
    port: settings.redis_port,
  });

  self.delaySha = null;
  self.throttleSha = null;
  self.throttleUndoSha = null;

  self.init = function(resetThrottling, resetTempCache, resetPermCache) {
    var multi = self.client.multi();
    multi.del(REQUEST_LIST_KEY);
    for (var i = 0; i < settings.lol_burst_requests; i++) {
      multi.rpush(REQUEST_LIST_KEY, 0);
    }

    return (resetThrottling ? Q.ninvoke(multi, 'exec') : Q()).then(function() {
      return resetTempCache ? self.resetTempCache() : Q();
    }).then(function() {
      return resetPermCache ? self.resetPermCache() : Q();
    }).then(function() {
      return Q.ninvoke(self.client, 'script', 'load', ATOMIC_DELAY_SCRIPT);
    }).then(function(sha) {
      self.delaySha = sha;
      return Q.ninvoke(self.client, 'script', 'load', ATOMIC_THROTTLE);
    }).then(function(sha) {
      self.throttleSha = sha;
      return Q.ninvoke(self.client, 'script', 'load', ATOMIC_THROTTLE_UNDO);
    }).then(function(sha) {
      self.throttleUndoSha = sha;
    });
  };

  self.deinit = function() {
    return Q.ninvoke(self.client, 'quit');
  };

  self.resetTempCache = function() {
    return Q.ninvoke(self.client, 'del', TEMP_DATA_KEY);
  };

  self.resetPermCache = function() {
    return Q.ninvoke(self.client, 'del', PERM_DATA_KEY);
  };

  self.getCached = function(url) {
    var multiGetCached = self.client.multi();
    multiGetCached.hget(TEMP_DATA_KEY, url);
    multiGetCached.hget(PERM_DATA_KEY, url);
    return Q.ninvoke(multiGetCached, 'exec');
  };

  self.setCached = function(url, body, permanent) {
    return Q.ninvoke(self.client, 'hset', permanent ? PERM_DATA_KEY : TEMP_DATA_KEY, url, body);
  };

  self.lolThrottleTime = function() {
    var time = (new Date()).getTime();
    return Q.ninvoke(self.client, 'evalsha', self.delaySha, 1, REQUEST_LIST_KEY, time, settings.lol_burst_period);
  };

  // Will return false if a given IP is creating accounts en masse.
  self.signUpAllowed = function(ip) {
    return Q.ninvoke(self.client, 'evalsha', self.throttleSha, 1, SIGN_UP_COUNT_KEY, ip, settings.sign_up_burst_period).then(function(count) {
      return count <= settings.sign_up_burst_count;
    });
  };

  // Will return false if a given identifier (IP or username) is failing log ins repeatedly.
  self.logInAllowed = function(ip, username) {
    var promises = [
      Q.ninvoke(self.client, 'evalsha', self.throttleSha, 1, LOG_IN_COUNT_KEY, IP_PREFIX + ip, settings.failed_log_in_reset_time),
      Q.ninvoke(self.client, 'evalsha', self.throttleSha, 1, LOG_IN_COUNT_KEY, USER_PREFIX + username, settings.failed_log_in_reset_time),
    ];
    return Q.all(promises).spread(function(ipCount, usernameCount) {
      return ipCount <= settings.failed_log_in_count && usernameCount <= settings.failed_log_in_count;
    });
  };

  // Need to call this when a log in is successful so that a user does not get throttled from logging in and out repeatedly.
  self.logInSuccess = function(ip, username) {
    var promises = [
      Q.ninvoke(self.client, 'evalsha', self.throttleUndoSha, 1, LOG_IN_COUNT_KEY, IP_PREFIX + ip),
      Q.ninvoke(self.client, 'evalsha', self.throttleUndoSha, 1, LOG_IN_COUNT_KEY, USER_PREFIX + username),
    ];
    return Q.all(promises).then(function() {
      // Absorb any results which are not needed.
    });
  };

  // Will return false if a given account or IP is creating League en
  // masse by creating and deleting Leagues repeatedly.
  self.leagueCreationAllowed = function(ip, username) {
    var promises = [
      Q.ninvoke(self.client, 'evalsha', self.throttleSha, 1, LEAGUE_CREATION_COUNT_KEY, IP_PREFIX + ip, settings.league_creation_burst_period),
      Q.ninvoke(self.client, 'evalsha', self.throttleSha, 1, LEAGUE_CREATION_COUNT_KEY, USER_PREFIX + username, settings.league_creation_burst_period),
    ];
    return Q.all(promises).spread(function(ipCount, usernameCount) {
      return ipCount <= settings.league_creation_burst_count && usernameCount <= settings.league_creation_burst_count;
    });
  };
}

module.exports = Redis;
