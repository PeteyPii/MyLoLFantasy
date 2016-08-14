var _ = require('lodash');
var express = require('express');
var Q = require('q');

var apiHelpers = require('./helpers.js');
var secretId = require('../secret_id.js');
var settings = require('../settings.js');

var router = express.Router();

router.get('/Leagues', function(req, res) {
  if (!req.user) {
    res.status(403);
    res.send('Unauthorized');
    return;
  }

  req.app.locals.db.getUsersLeagues(req.user.username).fail(function(reason) {
    res.status(500);
    res.send('Server error');
  }).done(function(leagues) {
    prunedLeagues = [];
    for (var i = 0; i < leagues.length; i++) {
      prunedLeagues.push({
        name: leagues[i].name,
        id: secretId.encodeLeagueId(leagues[i].id),
      });
    }
    res.send({
      a: prunedLeagues
    });
  });
});

router.post('/Leagues', apiHelpers.verifyCsrfToken, function(req, res) {
  if (!req.user) {
    res.status(403);
    res.send('Unauthorized');
    return;
  }

  var leagueName = req.body.leagueName;
  var summonerNames = req.body.summonerNames;
  var spectatorLeague = req.body.isSpectatorLeague;

  try {
    if (!_.isString(leagueName) || !_.isArray(summonerNames))
      throw true;
    if (!leagueName)
      throw true;
    if (_.some(summonerNames, function(summonerName) { return !summonerName || !_.isString(summonerName) || summonerName.length > 128; }))
      throw true;

    if (!spectatorLeague) {
      summonerNames.push(req.user.summonerName);
    }

    if (summonerNames.length <= 0 || summonerNames.length > 12)
      throw true;

    for (var i = 0; i < summonerNames.length; i++) {
      for (var j = i + 1; j < summonerNames.length; j++) {
        if (summonerNames[i] === summonerNames[j]) {
          throw true;
        }
      }
    }
  } catch(err) {
    res.status(400);
    res.send('Bad request');
    return;
  }

  var error = '';

  req.app.locals.db.getNumberOfUsersLeagues(req.user.username).then(function(count) {
    if (count >= settings.max_leagues_per_user) {
      error = 'Maximum number of Leagues limit reached';
      throw error;
    }

    var namePromises = summonerNames.map(function(summonerName) {
      return req.app.locals.lol.getSummonerId(req.user.region, summonerName);
    });

    return Q.all(namePromises).fail(function(err) {
      if (err.status) {
        error = 'Riot server ' + err.status + '\'ed';
      }

      throw err;
    });
  }).then(function(summonerIds) {
    var i;
    var j;
    if (_.some(summonerIds, function(summonerId) { return summonerId === -1; })) {
      error = 'At least one of the participating summoners does not exist';
      throw error;
    } else {
      for (i = 0; i < summonerIds.length; i++) {
        for (j = i + 1; j < summonerIds.length; j++) {
          if (summonerIds[i] === summonerIds[j]) {
            error = 'The League contains two identical members';
            throw error;
          }
        }
      }
    }

    var leagueData = {};
    for (i = 0; i < summonerNames.length; i++) {
      leagueData[summonerNames[i]] = {};
      leagueData[summonerNames[i]].summonerId = summonerIds[i];
      leagueData[summonerNames[i]].stats = {};

      var stats = leagueData[summonerNames[i]].stats;
      stats.championKills            = 0;
      stats.deaths                   = 0;
      stats.assists                  = 0;
      stats.minionKills              = 0;
      stats.doubleKills              = 0;
      stats.tripleKills              = 0;
      stats.quadraKills              = 0;
      stats.pentaKills               = 0;
      stats.goldEarned               = 0;
      stats.damageDealtToChampions   = 0;
      stats.healed                   = 0;
      stats.levels                   = 0;
      stats.turretKills              = 0;
      stats.wardKills                = 0;
      stats.wardPlaces               = 0;
      stats.damageTaken              = 0;
      stats.totalWins                = 0;
      stats.totalGames               = 0;
    }

    return req.app.locals.db.createLeague(leagueName, req.user.username, req.user.region, leagueData);
  }).then(function() {
    res.send({
      success: true,
    });
  }).fail(function(reason) {
    error = error || 'Unknown error...';
    res.send({
      success: false,
      reason: error,
    });
  }).done();
});

router.get('/Leagues/:leagueId', function(req, res) {
  var leagueId = req.params.leagueId;
  var error = '';

  leagueId = secretId.decodeLeagueId(leagueId);

  req.app.locals.db.getLeague(leagueId).fail(function(reason) {
    res.status(500);
    res.send('Server error');
  }).done(function(league) {
    if (!league) {
      res.status(404);
      res.send('Not found');
    } else {
      res.send(apiHelpers.prunedLeague(league, req.app.locals.stats));
    }
  });
});

router.delete('/Leagues/:leagueId', apiHelpers.verifyCsrfToken, function(req, res) {
  var leagueId = req.params.leagueId;
  var error = '';

  if (!req.user) {
    res.status(403);
    res.send('Unauthorized');
    return;
  }

  leagueId = secretId.decodeLeagueId(leagueId);

  req.app.locals.db.getLeague(leagueId).then(function(league) {
    if (!league) {
      res.status(404);
      res.send('Not found');
    } else if (league.owner !== req.user.username) {
      res.status(403);
      res.send('Unauthorized');
    } else {
      return req.app.locals.db.deleteLeague(leagueId).then(function() {
        res.send({
          success: true,
        });
      }).fail(function(reason) {
        error = 'An error occurred while attempting to delete \'' + league.name + '\'';
        throw reason;
      });
    }
  }).fail(function(reason) {
    reason = error || 'Unknown error...';
    res.send({
      success: false,
      reason: reason,
    });
  }).done();
});

router.post('/Leagues/:leagueId/Update', function(req, res) {
  var leagueId = req.params.leagueId;
  var error = '';

  // No check if user is logged in because it can be useful for anyone
  // to update any League and it's harmless with proper throttling.

  leagueId = secretId.decodeLeagueId(leagueId);

  req.app.locals.db.getLeague(leagueId).then(function(league) {
    if (!league) {
      res.status(404);
      res.send('Not found');
    } else {
      return req.app.locals.stats.updateStatsOfLeague(league);
    }
  }).then(function() {
    return req.app.locals.db.getLeague(leagueId);
  }).then(function(league) {
    if (!league) {
      error = 'League not found after updating...';
      throw error;
    } else {
      var prunedLeague = apiHelpers.prunedLeague(league, req.app.locals.stats);
      res.send({
        success: true,
        league: prunedLeague,
      });
    }
  }).fail(function(reason) {
    reason = error || 'Unknown error...';
    res.send({
      success: false,
      reason: reason,
    });
  }).done();
});

module.exports = router;
