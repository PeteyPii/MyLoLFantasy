app.controller('LeaguesController', ['$rootScope', '$scope', '$http', '$location', 'ngDialog',
  function($rootScope, $scope, $http, $location, ngDialog) {
    $rootScope.setActiveNavLink('leagues');
    $rootScope.title = 'Leagues';

    $scope.isLoading = true;
    $scope.loadError = false;

    $scope.leagues = null;
    $scope.idToName = null;

    $http.get('api/Leagues').then(function(response) {
      $scope.isLoading = false;
      $scope.leagues = response.data.a;
      $scope.idToName = {};
      for (var i = 0; i < $scope.leagues.length; i++) {
        $scope.leagues[i].lastUpdate = new Date($scope.leagues[i].lastUpdate);
        var league = $scope.leagues[i];
        $scope.idToName[league.id] = league.name;
      }
    }, function(response) {
      $scope.isLoading = false;
      $loadError = true;
      $rootScope.$broadcast('flashError', 'Could not retrieve your Leagues. Server responded with status code ' + response.status);
    });

    $scope.goToLeague = function(leagueId) {
      $location.path('League/' + leagueId);
    };

    var $outerScope = $scope;
    $scope.deleteLeague = function(leagueId) {
      ngDialog.open({
        template: 'views/dialogs/delete_league.html',
        className: 'dialog',
        disableAnimation: true,
        controller: ['$rootScope', '$scope', '$http', function($rootScope, $scope, $http) {
          $scope.leagueName = $outerScope.idToName[leagueId];
          $scope.confirmClick = function() {
            $http.delete('api/Leagues/' + leagueId).then(function(response) {
              if (response.data.success) {
                $rootScope.$broadcast('flashSuccess', 'Successfully deleted \'' + $scope.leagueName + '\'');
                for (var i = 0; i < $outerScope.leagues.length; i++) {
                  if ($outerScope.leagues[i].id === leagueId) {
                    $outerScope.leagues.splice(i, 1);
                    break;
                  }
                }
              } else {
                $rootScope.$broadcast('flashError', response.data.reason);
              }
            }, function(response) {
              $rootScope.$broadcast('flashError', 'Error deleting \'' + $scope.leagueName + '\'. Server responded with status code ' + response.status);
            });
            $scope.closeThisDialog();
          };
          $scope.cancelClick = function() {
            $scope.closeThisDialog();
          };
        }],
      });
    };
  }
]);
