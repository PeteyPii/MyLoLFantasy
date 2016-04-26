var app = angular.module('mlf', [
  'ngRoute',
]);

app.config(['$routeProvider', '$locationProvider',
  function($routeProvider, $locationProvider) {
    $routeProvider.when('/Home', {
      templateUrl: 'views/home.html',
      controller: 'HomeController',
    }).when('/', {
      redirectTo: '/Home'
    }).otherwise({
      templateUrl: 'views/page_not_found.html',
      controller: 'MissingPageController',
    });

    $locationProvider.html5Mode(true);
  }
]);

app.run(['$location', '$rootScope', '$window', function($location, $rootScope, $window) {
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
}]);
