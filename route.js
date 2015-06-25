var _ = require('lodash');
var bcrypt = require('bcrypt');
var express = require('express');
var passport = require('passport');
var Q = require('q');

var router = express.Router();

router.use(function logRequests(req, res, next) {
  console.log(req.method + ' request for MLF at ' + req.url);

  next();
});

router.use(function setRenderData(req, res, next) {
  res.locals.baseUrl = req.baseUrl;
  res.locals.isLoggedIn = !!req.user;
  res.locals.user = req.user;

  next();
});

router.get('/', function(req, res) {
  res.render('home');
});

router.get('/Home', function(req, res) {
  res.render('home');
});

router.post('/SignUp', function(req, res) {
  var username = req.body.username;
  var password = req.body.password;
  var confirmPassword = req.body.confirmPassword;
  var email = req.body.email;
  var summonerName = req.body.summonerName;
  var region = 'na';
  var acceptedAgreement = req.body.agree === 'true';

  try {
    if (!_.isString(username) || !_.isString(password) || !_.isString(confirmPassword) || !_.isString(email) || !_.isString(summonerName))
      throw true;
    if (!username || !password || !confirmPassword || !summonerName || !acceptedAgreement)
      throw true;
    if (password !== confirmPassword)
      throw true;
    if (username.length > 128 || password.length > 1024 || email.length > 128)
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
      req.flash('signupNameTaken', true);
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
      req.flash('signupSummonerNotExists', true);
      throw error;
    }

    return Q.ninvoke(bcrypt, 'hash', password, req.app.locals.settings.password_hash_rounds);
  }).then(function(hash) {
    return req.app.locals.db.createUser(username, hash, email, summonerName, region);
  }).then(function() {
    var user = {
      username: username
    };

    return Q.ninvoke(req, 'login', user);
  }).then(function() {
    res.send({
      success: true,
      url: req.baseUrl + '/Leagues'
    });
  }).fail(function(reason) {
    req.flash('signupError', error || 'Unknown error...');
    if (username) {
      req.flash('signupUsername', username);
    }
    if (summonerName) {
      req.flash('signupSummonerName', summonerName);
    }
    if (email) {
      req.flash('signupEmail', email);
    }

    res.send({
      success: false
    });
  }).done();

});

router.post('/LogIn', function(req, res) {
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

  function flashInputs() {
    if (username) {
      req.flash('loginUsername', username);
    }
  }

  passport.authenticate('local', function(err, user, info) {
    if (err) {
      throw err;
    }

    if (!user) {
      req.flash('loginError', 'Invalid login credentials');
      req.flash('loginMismatch', true);
      flashInputs();

      res.send({
        success: false
      });
    } else {
      Q.ninvoke(req, 'login', user).done(function() {
        res.send({
          success: true,
          url: req.baseUrl + '/Leagues'
        });
      });
    }
  })(req, res);
});

router.post('/LogOut', function(req, res) {
  req.logout();
  res.send({
    success: true,
    url: req.baseUrl + '/'
  });
});

router.get('/Leagues', function(req, res) {
  if (!req.user) {
    redirectRequireLogin(req, res);
    return;
  }

  req.app.locals.db.getUsersLeagues(req.user.username).done(function(leagues) {
    res.locals.leagues = leagues;
    res.render('leagues');
  });
});

router.get('/CreateLeague', function(req, res) {
  if (!req.user) {
    redirectRequireLogin(req, res);
    return;
  }

  res.render('create_league');
});

router.post('/CreateLeague', function(req, res) {
  var leagueName = req.body.leagueName;
  var summonerNames = req.body.summonerNames || [];
  var spectatorLeague = req.body.spectatorLeague === 'true';

  try {
    if (!req.user)
      throw true;
    if (!_.isString(leagueName) || !_.isArray(summonerNames))
      throw true;
    if (!leagueName)
      throw true;
    if (_.some(summonerNames, function(summonerName) { return !summonerName; }))
      throw true;

    var totalParticipants = summonerNames.length;
    if (!spectatorLeague) {
      totalParticipants++;
    }

    if (totalParticipants <= 0 || totalParticipants > 12)
      throw true;
  } catch(err) {
    res.status(400);
    res.send('Bad request');
    return;
  }

  var error = '';

  if (!spectatorLeague) {
    summonerNames.push(req.user.summonerName);
  }

  var namePromises = summonerNames.map(function(summonerName) {
    return req.app.locals.lol.getSummonerId(req.user.region, summonerName);
  });

  Q.all(namePromises).fail(function(err) {
    if (err.status) {
      error = 'Riot server ' + err.status + '\'ed';
    }

    throw err;
  }).then(function(summonerIds) {
    if (_.some(summonerIds, function(summonerId) { return summonerId === -1; })) {
      error = 'At least one of the participating summoners does not exist';
      req.flash('createLeagueInvalidSummoner', true);
      throw error;
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
    req.flash('createLeagueSuccess', 'Successfully created league!');
    res.send({
      success: true,
      url: req.baseUrl + '/Leagues'
    });
  }).fail(function(reason) {
    req.flash('createLeagueError', error || 'Unknown error...');
    if (leagueName) {
      req.flash('createLeagueName', leagueName);
    }

    if (!spectatorLeague) {
      summonerNames.pop();
    }

    if (summonerNames.length) {
      req.flash('createLeagueSummoners', summonerNames);
    }

    res.send({
      success: false
    });
  }).done();
});

module.exports = router;

router.get('/League_:leagueId', function(req, res) {
  if (!req.user) {
    redirectRequireLogin(req, res);
    return;
  }

  res.locals.leagueId = req.params.leagueId
  req.app.locals.db.getLeague(res.locals.leagueId).then(function(league) {
    if (league) {
      for (var user in league.data) {
        var points = req.app.locals.stats.evaluatePoints(league.data[user].stats);
        league.data[user].stats.totalPoints = points;
        res.locals.gamesPlayed = league.data[user].stats.totalGames;
      }
      res.locals.league = league;
    }

    res.render('league');
  }).fail(function(reason) {
    res.render('league');
  }).done();
});

function redirectRequireLogin(req, res) {
  req.flash('loginRequired', true);
  req.flash('loginError', 'You must be logged in to view that!');
  res.redirect(req.baseUrl + '/');
}
