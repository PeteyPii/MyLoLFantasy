var Q = require('q');
var redis = require('redis');
var request = require('request');

var REDIS_NAMESPACE = 'mlf:';

var REQUEST_LIST_KEY = REDIS_NAMESPACE + 'request_times';
var TEMP_DATA_KEY = REDIS_NAMESPACE + 'temp_data';
var PERM_DATA_KEY = REDIS_NAMESPACE + 'perm_data';

// Usage: 'EVAL <the_script> 1 mlf:request_times <current_time> <min_wait>'
// Returns: Time to wait
// Note: All times in ms
var ATOMIC_DELAY_SCRIPT =
  'local oldestTime = redis.call(\'lpop\', KEYS[1]);' +
  'local waitTime = math.max(0, ARGV[2] - (ARGV[1] - oldestTime));' +
  'redis.call(\'rpush\', KEYS[1], ARGV[1] + waitTime);' +
  'return waitTime;'

var buildUrl = function(region, version, api, argument, apiKey) {
  return 'https://' + region + '.api.pvp.net/api/lol/' + region + '/v' + version + '/' + api + '/' + argument + '?api_key=' + apiKey;
};

// All methods return Q promises
function lolApi(apiKey, requestBurstCount, requestBurstPeriod) {
  var self = this;

  self.config = {};
  self.config.apiKey = apiKey;
  self.config.requestBurstCount = requestBurstCount;
  self.config.requestBurstPeriod = requestBurstPeriod;

  self.redisClient = redis.createClient();

  self.delaySha = null;

  self.init = function() {
    var multi = self.redisClient.multi();
    multi.del(REQUEST_LIST_KEY);
    for (var i = 0; i < self.config.requestBurstCount; i++) {
      multi.rpush(REQUEST_LIST_KEY, 0);
    }

    return Q.ninvoke(multi, 'exec').then(function() {
      return self.resetTempCache();
    }).then(function() {
      return self.resetPermCache();
    }).then(function() {
      return Q.ninvoke(self.redisClient, 'script', 'load', ATOMIC_DELAY_SCRIPT);
    }).then(function(sha) {
      self.delaySha = sha;
    });
  };

  self.deinit = function() {
    return Q.ninvoke(self.redisClient, 'quit');
  };

  self.resetTempCache = function() {
    return Q.ninvoke(self.redisClient, 'del', TEMP_DATA_KEY);
  };

  self.resetPermCache = function() {
    return Q.ninvoke(self.redisClient, 'del', PERM_DATA_KEY);
  };

  self.getSummonerId = function(region, summonerName) {
    var url = buildUrl(region, 1.4, 'summoner/by-name', summonerName, self.config.apiKey);

    return self.smartRequest(url, true).then(function(data) {
      return data[summonerName.toLowerCase().replace(' ', '')].id;
    }, function(err) {
      if (err.status && err.status === 404) {
        return -1;
      } else {
        throw err;
      }
    });
  };

  self.getSummonersRecentGames = function(region, summonerId) {
    var url = buildUrl(region, 1.3, 'game/by-summoner', summonerId + '/recent', self.config.apiKey);

    return self.smartRequest(url, false).then(function(data) {
      return data.games;
    });
  };

  self.smartRequest = function(url, cachePermanently) {
    var multiGetCached = self.redisClient.multi();
    multiGetCached.hget(TEMP_DATA_KEY, url);
    multiGetCached.hget(PERM_DATA_KEY, url);

    return Q.ninvoke(multiGetCached, 'exec').then(function(results) {
      var data = results[0] || results[1];
      if (data) {
        return JSON.parse(data);
      } else {
        var time = (new Date()).getTime();

        return Q.ninvoke(self.redisClient, 'evalsha', self.delaySha, '1', REQUEST_LIST_KEY, time, self.config.requestBurstPeriod).then(function(waitTime) {
          return Q.delay(waitTime);
        }).then(function() {
          return Q.ninvoke(request, 'get', url);
        }).then(function(values) {
          var response = values[0];
          var body = values[1];

          switch (response.statusCode) {
            case 400:
            case 401:
            case 403:
            case 404:
            case 429:
            case 503:
              throw {
                status: response.statusCode
              };
          }

          // At the cost of a bit of performance we cache the result synchronously so that if the stats
          // API calls things rapidly, the cache is fresh and will be used
          return Q.ninvoke(self.redisClient, 'hset', cachePermanently ? PERM_DATA_KEY : TEMP_DATA_KEY, url, body).then(function() {
            return JSON.parse(body);
          });
        });
      }
    });
  };
}

module.exports = lolApi;
