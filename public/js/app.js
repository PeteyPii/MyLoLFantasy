var app = angular.module('mlf', [
  'ngCookies',
  'ngRoute',
  'ngDialog',
]);

var profile;

angular.element(document).ready(function() {
  $.get('api/Profile', function(data) {
    profile = data;
    angular.bootstrap(document, ['mlf']);
  });
});

app.config(['$routeProvider', '$locationProvider', '$httpProvider',
  function($routeProvider, $locationProvider, $httpProvider) {
    $routeProvider.when('/Home', {
      templateUrl: 'views/home.html',
      controller: 'HomeController',
      caseInsensitiveMatch: true,
    }).when('/', {
      redirectTo: '/Home',
      caseInsensitiveMatch: true,
    }).when('/SignUp', {
      templateUrl: 'views/sign_up.html',
      controller: 'SignUpController',
      caseInsensitiveMatch: true,
      loggedIn: false,
    }).when('/CreateLeague', {
      templateUrl: 'views/create_league.html',
      controller: 'CreateLeagueController',
      caseInsensitiveMatch: true,
      loggedIn: true,
    }).when('/Leagues', {
      templateUrl: 'views/leagues.html',
      controller: 'LeaguesController',
      caseInsensitiveMatch: true,
      loggedIn: true,
    }).when('/League/:leagueId', {
      templateUrl: 'views/league.html',
      controller: 'LeagueController',
      caseInsensitiveMatch: true,
    }).when('/EULA', {
      templateUrl: 'views/eula.html',
      controller: 'EULAController',
      caseInsensitiveMatch: true,
    }).otherwise({
      templateUrl: 'views/page_not_found.html',
      controller: 'MissingPageController',
    });

    $locationProvider.html5Mode(true);

    $httpProvider.interceptors.push('csrf');
  }
]);

app.run(['$location', '$rootScope', '$window', 'authService',
  function($location, $rootScope, $window, authService) {
    authService.setProfile(profile);

    $rootScope.$on('$viewContentLoaded', function() {
      // This isn't in $routeChangeSuccess since that event gets fired multiple times for redirects.
      if ($window.ga) {
        $window.ga('send', 'pageview', $location.path());
      }
    });

    $rootScope.activeNavLinks = {};
    $rootScope.setActiveNavLink = function(activeItem) {
      for (var item in $rootScope.activeNavLinks) {
        $rootScope.activeNavLinks[item] = false;
      }
      $rootScope.activeNavLinks[activeItem] = true;
    };
  }
]);
