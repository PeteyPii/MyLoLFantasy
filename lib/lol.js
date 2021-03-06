var _ = require('lodash');
var Q = require('q');
var request = require('request');

var settings = require('./settings.js');

var regionToPlatform = {
  br: 'br1',
  eune: 'eun1',
  euw: 'euw1',
  jp: 'jp1',
  kr: 'kr',
  lan: 'la1',
  las: 'la2',
  na:  'na1',
  oce: 'oc1',
  tr: 'tr1',
  ru: 'ru',
  pbe: 'pbe1',
};

var buildUrl = function(region, path, apiKey, queryParams) {
  queryParams = queryParams || {};
  queryParams = _.reduce(queryParams, function(result, value, key) {
    return result + '&' + key + '=' + value;
  }, '');
  return 'https://' + regionToPlatform[region] + '.api.riotgames.com' + path + '?api_key=' + apiKey + queryParams;
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

  self.getBothIds = function(region, summonerName) {
    var url = buildUrl(region, '/lol/summoner/v3/summoners/by-name/' + summonerName, settings.lol_api_key);

    return self.smartRequest(url, true, false).then(function(data) {
      return {
        accountId: data.accountId,
        summonerId: data.id,
      };
    }, function(err) {
      if (err.status && err.status === 404) {
        return {
          accountId: -1,
          summonerId: -1,
        };
      } else {
        throw err;
      }
    });
  };

  self.getAccountId = function(region, summonerId) {
    var url = buildUrl(region, '/lol/summoner/v3/summoners/' + summonerId, settings.lol_api_key);

    return self.smartRequest(url, true, false).then(function(data) {
      return data.accountId;
    }, function(err) {
      if (err.status && err.status === 404) {
        return -1;
      } else {
        throw err;
      }
    });
  };

  self.getAccountIsActive = function(region, accountId) {
    var url = buildUrl(region, '/lol/match/v3/matchlists/by-account/' + accountId, settings.lol_api_key);

    return self.smartRequest(url, true, false).then(function(data) {
      return true;
    }, function(err) {
      if (err.status && err.status === 404) {
        return false;
      } else {
        throw err;
      }
    });
  };

  self.getSummonersRecentGames = function(region, accountId, useCached) {
    var url = buildUrl(region, '/lol/match/v3/matchlists/by-account/' + accountId, settings.lol_api_key);
    return self.smartRequest(url, useCached, false).then(function(data) {
      return data.matches;
    }, function(err) {
      if (err.status && err.status === 422) {
        return [];
      } else {
        throw err;
      }
    });
  };

  self.getMatchData = function(region, gameId, useCached, forAccountId) {
    var url = buildUrl(region, '/lol/match/v3/matches/' + gameId, settings.lol_api_key, forAccountId ? {forAccountId: forAccountId} : undefined);

    return self.smartRequest(url, useCached, false).then(function(data) {
      return data;
    });
  };

  self.smartRequest = function(url, useCached, cachePermanently) {
    if (useCached) {
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
              case 422:
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
          case 422:
          case 429:
          case 503:
            throw {
              status: response.statusCode
            };
        }

        return JSON.parse(body);
      });
    }
  };
}

module.exports = LoL;
