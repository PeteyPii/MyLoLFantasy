var _ = require('lodash');
var bcrypt = require('bcrypt');
var express = require('express');
var passport = require('passport');
var Q = require('q');

var logger = require('./logger.js');
var version = require('./version.js');
var api = require('./api.js');

var router = express.Router();

router.use(function noStore(req, res, next) {
  // API should not be cached.
  res.header('Cache-Control', 'no-store');

  next();
});

router.use('/api', api);

module.exports = router;

// router.use(function setRenderData(req, res, next) {
//   res.locals.baseUrl = req.baseUrl;
//   res.locals.isLoggedIn = !!req.user;
//   res.locals.user = req.user;
//   res.locals.prod = req.app.locals.settings.is_prod;
//   res.locals.appSettings = req.app.locals.settings;
//   res.locals.version = version;

//   next();
// });


// router.get('/', function(req, res) {
//   res.render('home');
// });

// router.get('/Home', function(req, res) {
//   res.render('home');
// });

// router.get('/EULA', function(req, res) {
//   res.render('eula');
// });

// router.post('/LogIn', function(req, res) {
//   var username = req.body.username;
//   var password = req.body.password;

//   try {
//     if (!username || !password)
//       throw true;
//     if (username.length > 128 || password.length > 1024)
//       throw true;
//   } catch(err) {
//     res.status(400);
//     res.send('Bad request');
//     return;
//   }

//   function flashInputs() {
//     if (username) {
//       req.flash('loginUsername', username);
//     }
//   }

//   passport.authenticate('local', function(err, user, info) {
//     if (err) {
//       throw err;
//     }

//     if (!user) {
//       req.flash('loginError', 'Invalid login credentials');
//       req.flash('loginMismatch', true);
//       flashInputs();

//       res.send({
//         success: false
//       });
//     } else {
//       Q.ninvoke(req, 'login', user).done(function() {
//         res.send({
//           success: true,
//           url: req.baseUrl + '/Leagues'
//         });
//       });
//     }
//   })(req, res);
// });

// router.post('/LogOut', function(req, res) {
//   req.logout();
//   res.send({
//     success: true,
//     url: req.baseUrl + '/'
//   });
// });

// router.get('/Leagues', function(req, res) {
//   if (!req.user) {
//     redirectRequireLogin(req, res);
//     return;
//   }

//   req.app.locals.db.getUsersLeagues(req.user.username).done(function(leagues) {
//     res.locals.leagues = leagues;
//     res.render('leagues');
//   });
// });

// router.get('/CreateLeague', function(req, res) {
//   if (!req.user) {
//     redirectRequireLogin(req, res);
//     return;
//   }

//   res.render('create_league');
// });

// router.post('/CreateLeague', function(req, res) {
//   var leagueName = req.body.leagueName;
//   var summonerNames = req.body.summonerNames || [];
//   var spectatorLeague = req.body.spectatorLeague === 'true';

//   try {
//     if (!req.user)
//       throw true;
//     if (!_.isString(leagueName) || !_.isArray(summonerNames))
//       throw true;
//     if (!leagueName)
//       throw true;
//     if (_.some(summonerNames, function(summonerName) { return !summonerName; }))
//       throw true;

//     var totalParticipants = summonerNames.length;
//     if (!spectatorLeague) {
//       totalParticipants++;
//     }

//     if (totalParticipants <= 0 || totalParticipants > 12)
//       throw true;
//   } catch(err) {
//     res.status(400);
//     res.send('Bad request');
//     return;
//   }

//   var error = '';

//   if (!spectatorLeague) {
//     summonerNames.push(req.user.summonerName);
//   }

//   var namePromises = summonerNames.map(function(summonerName) {
//     return req.app.locals.lol.getSummonerId(req.user.region, summonerName);
//   });

//   Q.all(namePromises).fail(function(err) {
//     if (err.status) {
//       error = 'Riot server ' + err.status + '\'ed';
//     }

//     throw err;
//   }).then(function(summonerIds) {
//     if (_.some(summonerIds, function(summonerId) { return summonerId === -1; })) {
//       error = 'At least one of the participating summoners does not exist';
//       req.flash('createLeagueInvalidSummoner', true);
//       throw error;
//     }

//     var leagueData = {};
//     for (var i = 0; i < summonerNames.length; i++) {
//       leagueData[summonerNames[i]] = {};
//       leagueData[summonerNames[i]].summonerId = summonerIds[i];
//       leagueData[summonerNames[i]].stats = {};

//       var stats = leagueData[summonerNames[i]].stats;
//       stats.championKills            = 0;
//       stats.deaths                   = 0;
//       stats.assists                  = 0;
//       stats.minionKills              = 0;
//       stats.doubleKills              = 0;
//       stats.tripleKills              = 0;
//       stats.quadraKills              = 0;
//       stats.pentaKills               = 0;
//       stats.goldEarned               = 0;
//       stats.damageDealtToChampions   = 0;
//       stats.healed                   = 0;
//       stats.levels                   = 0;
//       stats.turretKills              = 0;
//       stats.wardKills                = 0;
//       stats.wardPlaces               = 0;
//       stats.damageTaken              = 0;
//       stats.totalWins                = 0;
//       stats.totalGames               = 0;
//     }

//     return req.app.locals.db.createLeague(leagueName, req.user.username, req.user.region, leagueData);
//   }).then(function() {
//     req.flash('createLeagueSuccess', 'Successfully created league!');
//     res.send({
//       success: true,
//       url: req.baseUrl + '/Leagues'
//     });
//   }).fail(function(reason) {
//     req.flash('createLeagueError', error || 'Unknown error...');
//     if (leagueName) {
//       req.flash('createLeagueName', leagueName);
//     }

//     if (!spectatorLeague) {
//       summonerNames.pop();
//     }

//     if (summonerNames.length) {
//       req.flash('createLeagueSummoners', summonerNames);
//     }

//     req.flash('spectatorLeague', spectatorLeague);

//     res.send({
//       success: false
//     });
//   }).done();
// });

// router.get('/League_:leagueId', function(req, res) {

//   if (!req.user) {
//     redirectRequireLogin(req, res);
//     return;
//   }

//   res.locals.leagueId = req.params.leagueId
//   req.app.locals.db.getLeague(res.locals.leagueId).then(function(league) {
//     if (league) {
//       for (var user in league.data) {
//         var points = req.app.locals.stats.evaluatePoints(league.data[user].stats);
//         league.data[user].stats.totalPoints = points;
//         res.locals.gamesPlayed = league.data[user].stats.totalGames;
//       }
//       res.locals.league = league;
//     }

//     res.render('league');
//   }).fail(function(reason) {
//     res.render('league');
//   }).done();
// });

// router.post('/DeleteLeague', function(req, res) {
//   if (!req.user) {
//     return;
//   }

//   var leagueId = req.body.leagueId;
//   var error = '';

//   try {
//     if (leagueId === undefined)
//       throw true;
//   } catch (err) {
//     res.status(400);
//     res.send('Bad request');
//     return;
//   }

//   req.app.locals.db.getLeague(leagueId).then(function(league) {
//     if (league.owner !== req.user.username) {
//       res.status(401);
//       res.send('Unauthorized');
//     } else {
//       req.app.locals.db.deleteLeague(leagueId).then(function() {
//         req.flash('deleteLeagueSuccess', 'League \'' + league.name + '\' deleted successfully!')
//         res.send({
//           success: true,
//           url: req.baseUrl + '/Leagues'
//         });
//       }).fail(function() {
//         error = 'An error occurred while attmepting to delete the League \'' + league.name + '\'';
//         throw error;
//       }).done();
//     }
//   }).fail(function(reason) {
//     req.flash('deleteLeagueError', error || 'Unknown error...')
//     res.send({
//       success: false,
//       url: req.baseUrl + '/Leagues'
//     });
//   }).done();
// });

// router.use(function(req, res) {
//   res.status(404);

//   res.render('404');
// });

// function redirectRequireLogin(req, res) {
//   req.flash('loginRequired', true);
//   req.flash('loginError', 'You must be logged in to view that!');
//   res.redirect(req.baseUrl + '/');
// }
