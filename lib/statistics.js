var _ = require('lodash');
var decimal = require('deci-mal');
var Q = require('q');

var logger = require('./logger.js');

module.exports = function(db, lol) {
  var self = this;

  // Return total points of stats as a string
  self.evaluatePoints = function(stats) {
    var totalPoints = decimal.fromNumber(0, 2);

    totalPoints = totalPoints.add(decimal.fromNumber(stats.championKills, 2)           .mult(decimal.fromNumber(2, 2)));
    totalPoints = totalPoints.add(decimal.fromNumber(stats.deaths, 2)                  .mult(decimal.fromNumber(-2, 2)));
    totalPoints = totalPoints.add(decimal.fromNumber(stats.assists, 2)                 .mult(decimal.fromNumber(1.5, 2)));
    totalPoints = totalPoints.add(decimal.fromNumber(stats.minionKills, 2)             .mult(decimal.fromNumber(0.01, 2)));
    totalPoints = totalPoints.add(decimal.fromNumber(stats.doubleKills, 2)             .mult(decimal.fromNumber(1, 2)));
    totalPoints = totalPoints.add(decimal.fromNumber(stats.tripleKills, 2)             .mult(decimal.fromNumber(2, 2)));
    totalPoints = totalPoints.add(decimal.fromNumber(stats.quadraKills, 2)             .mult(decimal.fromNumber(5, 2)));
    totalPoints = totalPoints.add(decimal.fromNumber(stats.pentaKills, 2)              .mult(decimal.fromNumber(12, 2)));
    totalPoints = totalPoints.add(decimal.fromNumber(stats.goldEarned, 2)              .mult(decimal.fromNumber(0, 2)));
    totalPoints = totalPoints.add(decimal.fromNumber(stats.damageDealtToChampions, 2)  .mult(decimal.fromNumber(0, 2)));
    totalPoints = totalPoints.add(decimal.fromNumber(stats.healed, 2)                  .mult(decimal.fromNumber(0, 2)));
    totalPoints = totalPoints.add(decimal.fromNumber(stats.levels, 2)                  .mult(decimal.fromNumber(0, 2)));
    totalPoints = totalPoints.add(decimal.fromNumber(stats.turretKills, 2)             .mult(decimal.fromNumber(3, 2)));
    totalPoints = totalPoints.add(decimal.fromNumber(stats.wardKills, 2)               .mult(decimal.fromNumber(0, 2)));
    totalPoints = totalPoints.add(decimal.fromNumber(stats.wardPlaces, 2)              .mult(decimal.fromNumber(0, 2)));
    totalPoints = totalPoints.add(decimal.fromNumber(stats.damageTaken, 2)             .mult(decimal.fromNumber(0, 2)));
    totalPoints = totalPoints.add(decimal.fromNumber(stats.totalWins, 2)               .mult(decimal.fromNumber(0, 2)));
    totalPoints = totalPoints.add(decimal.fromNumber(stats.totalGames, 2)              .mult(decimal.fromNumber(0, 2)));

    return parseFloat(totalPoints.toString());
  };

  self.updateAllLeagues = function(useCached) {
    return Q.Promise(function(resolve, reject) {
      var gotAllRows = false;
      var rowsReceived = 0;
      var rowsProcessed = 0;

      function resolveCheck() {
        if (gotAllRows && rowsProcessed === rowsReceived) {
          resolve();
        }
      }

      db.getAllLeagues(function(league) {
        rowsReceived++;
        self.updateStatsOfLeague(league, useCached).then(function() {
          rowsProcessed++;
          logger.log('Updated League with id: ' + league.id);
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
  };

  self.updateStatsOfLeague = function(league, useCached) {
    var trackedMatches = {};
    for (var i = 0; i < league.matches_tracked.length; i++) {
      trackedMatches[league.matches_tracked[i]] = true;
    }

    var accountIdToSummoner = {};
    _.forEach(league.data, function(summonerData, summonerName) {
      accountIdToSummoner[summonerData.accountId] = summonerName;
    });

    var eachSummonerGameIds = [];
    var recentGamesPromises = _.map(league.data, function(summonerData, summonerName) {
      return lol.getSummonersRecentGames(league.region, league.data[summonerName].accountId, useCached).then(function(matches) {
        var summonerGameIds = [];
        for (var i = 0; i < matches.length; i++) {
          if (matches[i].timestamp > league.creation_time.getTime() && !trackedMatches[matches[i].gameId]) {
            summonerGameIds.push(matches[i].gameId);
          }
        }
        eachSummonerGameIds.push(summonerGameIds);
      });
    });

    return Q.all(recentGamesPromises).then(function() {
      var newCommonGameIds = eachSummonerGameIds[0];
      for (var i = 1; i < eachSummonerGameIds.length; i++) {
        newCommonGameIds = _.intersection(newCommonGameIds, eachSummonerGameIds[i]);
      }

      var trackGamePromises = newCommonGameIds.map(function(gameId) {
        return lol.getMatchData(league.region, gameId, useCached).then(function(match) {
          var participantIdToSummoner = {};

          _.forEach(match.participantIdentities, function(participantIdentity) {
            if (accountIdToSummoner[participantIdentity.player.accountId]) {
              participantIdToSummoner[participantIdentity.participantId] = accountIdToSummoner[participantIdentity.player.accountId];
            }
          });

          _.forEach(match.participants, function(participant) {
            if (!participantIdToSummoner[participant.participantId]) {
              return;
            }
            var summonerName = participantIdToSummoner[participant.participantId];
            var playerStats = league.data[summonerName].stats;
            var gameStats = participant.stats;

            playerStats.championKills            += gameStats.kills || 0;
            playerStats.deaths                   += gameStats.deaths || 0;
            playerStats.assists                  += gameStats.assists || 0;
            playerStats.minionKills              += (gameStats.totalMinionsKilled || 0) + (gameStats.neutralMinionsKilled || 0);
            playerStats.doubleKills              += gameStats.doubleKills || 0;
            playerStats.tripleKills              += gameStats.tripleKills || 0;
            playerStats.quadraKills              += gameStats.quadraKills || 0;
            playerStats.pentaKills               += gameStats.pentaKills || 0;
            playerStats.goldEarned               += gameStats.goldEarned || 0;
            playerStats.damageDealtToChampions   += gameStats.totalDamageDealtToChampions || 0;
            playerStats.healed                   += gameStats.totalHeal || 0;
            playerStats.levels                   += gameStats.champLevel || 0;
            playerStats.turretKills              += gameStats.turretKills || 0;
            playerStats.wardKills                += gameStats.wardsKilled || 0;
            playerStats.wardPlaces               += gameStats.wardsPlaced || 0;
            playerStats.damageTaken              += gameStats.totalDamageTaken || 0;
            playerStats.totalWins                += gameStats.win ? 1 : 0;
            playerStats.totalGames               += 1;
          });
        });
      });

      return Q.all(trackGamePromises).then(function() {
        return db.updateLeague(league.id, league.data, newCommonGameIds);
      });
    });
  };
};
