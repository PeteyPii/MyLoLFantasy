var Q = require('q');
var redis = require('redis');

var settings = require('./settings.js');

var REDIS_NAMESPACE = 'mlf:';

var REQUEST_LIST_KEY = REDIS_NAMESPACE + 'request_times';
var TEMP_DATA_KEY = REDIS_NAMESPACE + 'temp_data';
var PERM_DATA_KEY = REDIS_NAMESPACE + 'perm_data';
var SIGNUP_COUNT_KEY = REDIS_NAMESPACE + 'sign_up_counts';

// Usage: 'EVAL <the_script> 1 mlf:request_times <current_time> <min_wait>'
// Returns: Time to wait
// Note: All times in ms
var ATOMIC_DELAY_SCRIPT =
  'local oldestTime = redis.call(\'lpop\', KEYS[1]);' +
  'local waitTime = math.max(0, ARGV[2] - (ARGV[1] - oldestTime));' +
  'redis.call(\'rpush\', KEYS[1], ARGV[1] + waitTime);' +
  'return waitTime;';

// Usage: 'EVAL <the_script> 1 mlf:sign_up_counts <ip> <period>'
// Returns: Number of sign ups for the given IP in recent-most period
// Note: All times in ms
var ATOMIC_SIGN_UP_THROTTLE =
  'local existed = redis.call(\'exists\', KEYS[1]);' +
  'local count = redis.call(\'hincrby\', KEYS[1], ARGV[1], 1);' +
  'if existed == 0 then ' +
  '  redis.call(\'pexpire\', KEYS[1], ARGV[2]);' +
  'end ' +
  'return count;';

// All methods return Q promises
function Redis() {
  var self = this;

  self.client = redis.createClient({
    host: settings.redis_host,
    port: settings.redis_port,
  });

  self.delaySha = null;
  self.signUpThrottleSha = null;

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
      return Q.ninvoke(self.client, 'script', 'load', ATOMIC_SIGN_UP_THROTTLE);
    }).then(function(sha) {
      self.signUpThrottleSha = sha;
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

  self.signUpAllowed = function(ip) {
    return Q.ninvoke(self.client, 'evalsha', self.signUpThrottleSha, 1, SIGNUP_COUNT_KEY, ip, settings.sign_up_burst_period).then(function(count) {
      return count <= settings.sign_up_burst_count;
    });;
  };
}

module.exports = Redis;
