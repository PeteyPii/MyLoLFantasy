var app = angular.module('mlf', [
  'ngRoute',
]);

var profile;

angular.element(document).ready(function() {
  $.get('api/Profile', function(data) {
    profile = data;
    angular.bootstrap(document, ['mlf']);
  });
});

app.config(['$routeProvider', '$locationProvider',
  function($routeProvider, $locationProvider) {
    $routeProvider.when('/Home', {
      templateUrl: 'views/home.html',
      controller: 'HomeController',
    }).when('/', {
      redirectTo: '/Home'
    }).when('/SignUp', {
      templateUrl: 'views/sign_up.html',
      controller: 'SignUpController',
    }).otherwise({
      templateUrl: 'views/page_not_found.html',
      controller: 'MissingPageController',
    });

    $locationProvider.html5Mode(true);
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
