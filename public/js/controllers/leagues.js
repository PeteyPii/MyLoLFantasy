app.controller('LeaguesController', ['$rootScope', '$scope', '$http', '$location', 'ngDialog',
  function($rootScope, $scope, $http, $location, ngDialog) {
    $rootScope.setActiveNavLink('leagues');
    $rootScope.title = 'Leagues';

    $scope.isLoading = true;
    $scope.loadError = false;

    $scope.leagues = null;
    $scope.idToName = null;

    $http.get('api/leagues').then(function(response) {
      $scope.isLoading = false;
      loadLeagues(response.data.a);
    }, function(response) {
      $scope.isLoading = false;
      $loadError = true;
      $rootScope.$broadcast('flashError', 'Could not retrieve your Leagues. Server responded with status code ' + response.status);
    });

    $scope.goToLeague = function(leagueId) {
      $location.path('league/' + leagueId);
    };

    var $outerScope = $scope;
    $scope.deleteLeague = function(leagueId) {
      ngDialog.open({
        template: 'views/dialogs/delete_league.html?v=' + gVersion,
        className: 'dialog',
        disableAnimation: true,
        controller: ['$rootScope', '$scope', '$http', function($rootScope, $scope, $http) {
          $scope.leagueName = $outerScope.idToName[leagueId];
          $scope.confirmClick = function() {
            $http.delete('api/leagues/' + leagueId).then(function(response) {
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

    var isUpdating = false;
    $scope.updateLeagues = function() {
      if (!isUpdating) {
        isUpdating = true;
        $http.post('api/leagues-control/update').then(function(response) {
          isUpdating = false;
          if (response.data.success) {
            loadLeagues(response.data.leagues);
            $rootScope.$broadcast('flashSuccess', 'Successfully refreshed any outdated stats for your Leagues.');
          } else {
            $rootScope.$broadcast('flashError', response.data.reason);
          }
        }, function(response) {
          isUpdating = false;
          $rootScope.$broadcast('flashError', 'Error updating your Leagues. Server responded with status code ' + response.status);
        });
      }
    };

    function loadLeagues(leagues) {
      $scope.leagues = leagues;
      $scope.idToName = {};
      for (var i = 0; i < leagues.length; i++) {
        var league = $scope.leagues[i];
        league.lastUpdate = new Date(league.lastUpdate);
        $scope.idToName[league.id] = league.name;
      }
    }
  }
]);
