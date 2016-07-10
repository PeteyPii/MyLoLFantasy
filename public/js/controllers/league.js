app.controller('LeagueController', ['$rootScope', '$scope', '$routeParams', '$http', '$location', 'ngDialog',
  function($rootScope, $scope, $routeParams, $http, $location, ngDialog) {
    $rootScope.setActiveNavLink('league');
    $rootScope.title = 'Leagues';

    $scope.isLoading = true;
    $scope.loadError = false;
    $scope.exists = false;
    $scope.league = {};

    $http.get('api/League/' + $routeParams.leagueId).then(function(response) {
      $scope.isLoading = false;
      $scope.exists = true;
      $scope.league = response.data;
    }, function(response) {
      $scope.isLoading = false;
      if (response.status === 404) {
        // $scope is set up to imply the League does not exist.
      } else {
        $scope.loadError = true;
        $rootScope.$broadcast('flashError', 'Server responded with status code ' + response.status);
      }
    });
  }
]);
