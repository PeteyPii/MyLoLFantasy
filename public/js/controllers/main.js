app.controller('MainController', ['$rootScope', '$scope', '$location', 'authService',
  function($rootScope, $scope, $location, authService) {
    var logInRequirements;
    $scope.$on('$routeChangeStart', function(scope, next, current) {
      var loggedIn = next.$$route.loggedIn;
      if (loggedIn !== undefined) {
        if (loggedIn === true && !authService.isLoggedIn()) {
          $rootScope.$broadcast('flashError', 'You must be logged in to view that page!');
          $location.path('Home');
        } else if (loggedIn === false && authService.isLoggedIn()) {
          $rootScope.$broadcast('flashError', 'You are already logged in!');
          $location.path('Home');
        }
      }
    });

    $scope.$on('$routeChangeSuccess', function(event, current, previous) {
      logInRequirements = current.$$route.loggedIn;
    });

    $scope.$on('profileChanged', function(event) {
      if (logInRequirements !== undefined) {
        if (logInRequirements === true && !authService.isLoggedIn()) {
          $location.path('Home');
        } else if (logInRequirements === false && authService.isLoggedIn()) {
          $location.path('Home');
        }
      }
    });
  }
]);
