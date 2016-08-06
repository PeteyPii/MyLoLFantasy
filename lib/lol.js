var Q = require('q');
var request = require('request');

var settings = require('./settings.js');

var buildUrl = function(region, version, api, argument, apiKey) {
  return 'https://' + region + '.api.pvp.net/api/lol/' + region + '/v' + version + '/' + api + '/' + argument + '?api_key=' + apiKey;
};

// All methods return Q promises
function LoL(redis) {
  var self = this;

  self.redis = redis;

  self.init = function() {
    return Q();
  };

  self.deinit = function() {
    return Q();
  };

  self.getSummonerId = function(region, summonerName) {
    var url = buildUrl(region, 1.4, 'summoner/by-name', summonerName, settings.lol_api_key);

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
    var url = buildUrl(region, 1.3, 'game/by-summoner', summonerId + '/recent', settings.lol_api_key);

    return self.smartRequest(url, false).then(function(data) {
      return data.games;
    });
  };

  self.smartRequest = function(url, cachePermanently) {
    return self.redis.getCached(url).then(function(results) {
      var data = results[0] || results[1];
      if (data) {
        return JSON.parse(data);
      } else {
        return self.redis.lolThrottleTime().then(function(waitTime) {
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
          return self.redis.setCached(url, body, cachePermanently).then(function() {
            return JSON.parse(body);
          });
        });
      }
    });
  };
}

module.exports = LoL;
