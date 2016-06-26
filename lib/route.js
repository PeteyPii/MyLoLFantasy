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
