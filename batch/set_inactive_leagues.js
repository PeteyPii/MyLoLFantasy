var Q = require('q');
var _ = require('lodash');

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
    return Q.Promise(function(resolve, reject) {
      var gotAllRows = false;
      var rowsReceived = 0;
      var rowsProcessed = 0;
      var newInactiveLeagues = [];
      function resolveCheck() {
        if (gotAllRows && rowsProcessed === rowsReceived) {
          resolve(newInactiveLeagues);
        }
      }

      db.getAllLeagues(function(league) {
        rowsReceived++;

        if (league.is_inactive) {
          rowsProcessed++;
          resolveCheck();
          return;
        }

        var activeAccounts = {};
        var checkAccountsPromises = _.map(league.data, function(summonerData, summonerName) {
          return lol.getAccountIsActive(league.region, summonerData.accountId).then(function(isActive) {
            activeAccounts[summonerData.accountId] = isActive;
          });
        });

        Q.all(checkAccountsPromises).then(function() {
          var inactiveSummoner = false;
          _.forEach(activeAccounts, function(isActive, accountId) {
            if (!isActive) {
              inactiveSummoner = true;
              logger.log('Account #' + accountId + ' is inactive. Marking league #' + league.id + ' as inactive.');
              newInactiveLeagues.push(league.id);
              return false;
            }
          });
          rowsProcessed++;
          resolveCheck();
        }).fail(function(err) {
          logger.error('Failed to process League with id: ' + league.id);
          rowsProcessed++;
          resolveCheck();
        }).done();
      }, function() {
        gotAllRows = true;
        resolveCheck();
      });
    });
  }).then(function(newInactiveLeagues) {
    var promises = newInactiveLeagues.map(function(leagueId) {
      return db.setLeagueInactiveFlag(leagueId, true);
    });
    return Q.allSettled(promises);
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
