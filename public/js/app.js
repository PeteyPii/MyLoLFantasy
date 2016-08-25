var app = angular.module('mlf', [
  'LocalStorageModule',
  'ngCookies',
  'ngDialog',
  'ngRoute',
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
      templateUrl: 'views/home.html?v=' + gVersion,
      controller: 'HomeController',
      caseInsensitiveMatch: true,
    }).when('/', {
      redirectTo: '/Home',
      caseInsensitiveMatch: true,
    }).when('/SignUp', {
      templateUrl: 'views/sign_up.html?v=' + gVersion,
      controller: 'SignUpController',
      caseInsensitiveMatch: true,
      loggedIn: false,
    }).when('/CreateLeague', {
      templateUrl: 'views/create_league.html?v=' + gVersion,
      controller: 'CreateLeagueController',
      caseInsensitiveMatch: true,
      loggedIn: true,
    }).when('/Leagues', {
      templateUrl: 'views/leagues.html?v=' + gVersion,
      controller: 'LeaguesController',
      caseInsensitiveMatch: true,
      loggedIn: true,
    }).when('/League/:leagueId', {
      templateUrl: 'views/league.html?v=' + gVersion,
      controller: 'LeagueController',
      caseInsensitiveMatch: true,
    }).when('/EULA', {
      templateUrl: 'views/eula.html?v=' + gVersion,
      controller: 'EULAController',
      caseInsensitiveMatch: true,
    }).when('/About', {
      templateUrl: 'views/about.html?v=' + gVersion,
      controller: 'AboutController',
      caseInsensitiveMatch: true,
    }).when('/PrivacyPolicy', {
      templateUrl: 'views/privacy_policy.html?v=' + gVersion,
      controller: 'PrivacyPolicyController',
      caseInsensitiveMatch: true,
    }).when('/ResetPassword', {
      templateUrl: 'views/reset_password.html?v=' + gVersion,
      controller: 'ResetPasswordController',
      caseInsensitiveMatch: true,
      loggedIn: false,
    }).when('/ResetPassword/:token', {
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
