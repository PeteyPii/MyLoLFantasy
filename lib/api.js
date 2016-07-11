var _ = require('lodash');
var bcrypt = require('bcrypt');
var express = require('express');
var passport = require('passport');
var Q = require('q');

var secretId = require('./secret_id.js');
var logger = require('./logger.js');
var settings = require('./settings.js');

var router = express.Router();

function createProfileData(user) {
  if (user) {
    return {
      isLoggedIn: true,
      username: user.username,
      summonerName: user.summonerName,
    };
  } else {
    return {
      isLoggedIn: false,
    };
  }
}

function verifyCsrfToken(req, res, next) {
  if (req.cookies.csrf !== req.get('X-CSRF-Token')) {
    res.status(403);
    res.send('Unauthorized');
  } else {
    next();
  }
}

router.use(function noStore(req, res, next) {
  // API should not be cached.
  res.header('Cache-Control', 'no-store');
  next();
});

router.use('/Profile', function(req, res, next) {
  if (req.user) {
    res.send(createProfileData(req.user));
  } else {
    res.send(createProfileData(req.user));
  }
});

router.post('/SignUp', verifyCsrfToken, function(req, res) {
  var username = req.body.username;
  var password = req.body.password;
  var confirmPassword = req.body.confirmPassword;
  var email = req.body.email;
  var summonerName = req.body.summonerName;
  var region = 'na';
  var acceptedAgreement = req.body.agree;

  try {
    if (!_.isString(username) || !_.isString(password) || !_.isString(confirmPassword) || !_.isString(email) || !_.isString(summonerName))
      throw true;
    if (!username || !password || !confirmPassword || !summonerName)
      throw true;
    if (password !== confirmPassword)
      throw true;
    if (username.length > 128 || password.length > 1024 || email.length > 128 || summonerName.length > 128)
      throw true;
    if (!acceptedAgreement)
      throw true;
  } catch (err) {
    res.status(400);
    res.send('Bad request');
    return;
  }

  var error = '';

  req.app.locals.db.getUser(username).then(function(user) {
    if (user) {
      error = 'Username is taken';
      throw error;
    } else {
      return req.app.locals.lol.getSummonerId(region, summonerName).fail(function(err) {
        if (err.status) {
          error = 'Riot server ' + err.status + '\'ed';
        }

        throw err;
      });
    }
  }).then(function(id) {
    if (id === -1) {
      error = 'Summoner does not exist';
      throw error;
    }

    return Q.ninvoke(bcrypt, 'hash', password, req.app.locals.settings.password_hash_rounds);
  }).then(function(hash) {
    return req.app.locals.db.createUser(username, hash, email, summonerName, region);
  }).then(function() {
    var user = {
      username: username,
      region: region,
      summonerName: summonerName,
    };

    return Q.ninvoke(req, 'login', user);
  }).then(function() {
    res.send({
      success: true,
      profile: createProfileData(req.user),
    });
  }).fail(function(reason) {
    reason = error || 'Unknown error...';
    res.send({
      success: false,
      reason: reason,
    });
  }).done();
});

router.post('/LogIn', verifyCsrfToken, function(req, res) {
  var username = req.body.username;
  var password = req.body.password;

  try {
    if (!username || !password)
      throw true;
    if (username.length > 128 || password.length > 1024)
      throw true;
  } catch(err) {
    res.status(400);
    res.send('Bad request');
    return;
  }

  passport.authenticate('local', function(err, user, info) {
    if (err) {
      throw err;
    }

    if (!user) {
      res.send({
        success: false,
        reason: 'Invalid log in credentials',
      });
    } else {
      Q.ninvoke(req, 'login', user).done(function() {
        res.send({
          success: true,
          profile: createProfileData(user),
        });
      });
    }
  })(req, res);
});

router.post('/LogOut', verifyCsrfToken, function(req, res) {
  req.logout();
  res.send({
    success: true,
    profile: createProfileData(req.user),
  });
});

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

router.post('/CreateLeague', verifyCsrfToken, function(req, res) {
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
      error = 'Maximum number of Leagues limit reached'
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
    if (_.some(summonerIds, function(summonerId) { return summonerId === -1; })) {
      error = 'At least one of the participating summoners does not exist';
      throw error;
    } else {
      for (var i = 0; i < summonerIds.length; i++) {
        for (var j = i + 1; j < summonerIds.length; j++) {
          if (summonerIds[i] === summonerIds[j]) {
            error = 'The League contains two identical members';
            throw error;
          }
        }
      }
    }

    var leagueData = {};
    for (var i = 0; i < summonerNames.length; i++) {
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

router.get('/League/:leagueId', function(req, res) {
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
      var prunedLeague = {
        name: league.name,
        id: secretId.encodeLeagueId(league.id),
        owner: league.owner,
        region: league.region,
        data: {},
      }
      var gameCount;
      for (var summoner in league.data) {
        var summonerData = {
          stats: league.data[summoner].stats,
          points: req.app.locals.stats.evaluatePoints(league.data[summoner].stats),
        };
        gameCount = league.data[summoner].stats.totalGames;
        prunedLeague.data[summoner] = summonerData;
      }
      prunedLeague.gameCount = gameCount;
      res.send(prunedLeague);
    }
  });
});

router.delete('/League/:leagueId', verifyCsrfToken, function(req, res) {
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

module.exports = router;
