var app = angular.module('mlf', [
  'LocalStorageModule',
  'ngCookies',
  'ngDialog',
  'ngRoute',
]);

var profile;

angular.element(document).ready(function() {
  $.get('api/profile', function(data) {
    profile = data;
    angular.bootstrap(document, ['mlf']);
  });
});

app.config(['$routeProvider', '$locationProvider', '$httpProvider',
  function($routeProvider, $locationProvider, $httpProvider) {
    $routeProvider.when('/Home', {
      templateUrl: 'views/home.html?v=' + gVersion,
      controller: 'HomeController',
      caseInsensitiveMatch: true,
    }).when('/', {
      redirectTo: '/home',
      caseInsensitiveMatch: true,
    }).when('/sign-up', {
      templateUrl: 'views/sign_up.html?v=' + gVersion,
      controller: 'SignUpController',
      caseInsensitiveMatch: true,
      loggedIn: false,
    }).when('/create-league', {
      templateUrl: 'views/create_league.html?v=' + gVersion,
      controller: 'CreateLeagueController',
      caseInsensitiveMatch: true,
      loggedIn: true,
    }).when('/leagues', {
      templateUrl: 'views/leagues.html?v=' + gVersion,
      controller: 'LeaguesController',
      caseInsensitiveMatch: true,
      loggedIn: true,
    }).when('/league/:leagueId', {
      templateUrl: 'views/league.html?v=' + gVersion,
      controller: 'LeagueController',
      caseInsensitiveMatch: true,
    }).when('/eula', {
      templateUrl: 'views/eula.html?v=' + gVersion,
      controller: 'EULAController',
      caseInsensitiveMatch: true,
    }).when('/about', {
      templateUrl: 'views/about.html?v=' + gVersion,
      controller: 'AboutController',
      caseInsensitiveMatch: true,
    }).when('/privacy-policy', {
      templateUrl: 'views/privacy_policy.html?v=' + gVersion,
      controller: 'PrivacyPolicyController',
      caseInsensitiveMatch: true,
    }).when('/reset-password', {
      templateUrl: 'views/reset_password.html?v=' + gVersion,
      controller: 'ResetPasswordController',
      caseInsensitiveMatch: true,
      loggedIn: false,
    }).when('/reset-password/:token', {
      templateUrl: 'views/reset_new_password.html?v=' + gVersion,
      controller: 'ResetNewPasswordController',
      caseInsensitiveMatch: true,
      loggedIn: false,
    }).otherwise({
      templateUrl: 'views/page_not_found.html?v=' + gVersion,
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
