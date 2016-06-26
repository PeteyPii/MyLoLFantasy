app.controller('CreateLeagueController', ['$scope', '$rootScope', '$http', '$location', 'authService',
  function ($scope, $rootScope, $http, $location, authService) {
    $rootScope.setActiveNavLink('createLeague');
    $rootScope.title = 'Create League';

    $scope.leagueName = '';
    var summonerCount = 2;
    $scope.summonerNames = {
      0: '',
      1: '',
    };
    $scope.isSpectatorLeague = false;

    $scope.error = {
      leagueName: false,
      summonerNames: {
        0: false,
        1: false,
      },
      isSpectatorLeague: false,
    };

    $scope.add = function() {
      if (summonerCount === 12) {
        $rootScope.$broadcast('flashError', 'Leagues cannot contain more than twelve players');
        return;
      }
      $scope.summonerNames[summonerCount] = '';
      $scope.error.summonerNames[summonerCount] = '';
      summonerCount++;
    };

    $scope.remove = function(index) {
      for (var i = index; i < summonerCount; i++) {
        $scope.summonerNames[i] = $scope.summonerNames[i + 1];
        $scope.error.summonerNames[i] = $scope.error.summonerNames[i + 1];
      }
      summonerCount--;
      delete $scope.summonerNames[summonerCount];
      delete $scope.error.summonerNames[summonerCount];
    };

    var isWorking = false;
    $scope.createLeague = function() {
      if (!isWorking) {
        $scope.error = {
          leagueName: false,
          summonerNames: {},
          isSpectatorLeague: false,
        };
        for (var i = 0; i < summonerCount; i++) {
          $scope.error.summonerNames[i] = false;
        }

        if (!$scope.leagueName) {
          $scope.error.leagueName = true;
          $rootScope.$broadcast('flashError', 'League must have a name');
        } else if (!$scope.isSpectatorLeague && summonerCount < 1) {
          $rootScope.$broadcast('flashError', 'League cannot be a spectator League without any summoners');
        } else {
          foundError = false;
          for (var i = 0; i < summonerCount; i++) {
            if (!$scope.summonerNames[i]) {
              $scope.error.summonerNames[i] = true;
              $rootScope.$broadcast('flashError', 'Summoner name cannot be empty');
              foundError = true;
              break;
            } else if ($scope.summonerNames[i].length > 128) {
              $scope.error.summonerNames[i] = true;
              $rootScope.$broadcast('flashError', 'Summoner name cannot be longer than 128 characters');
              foundError = true;
              break;
            } else if (!$scope.isSpectatorLeague && $scope.summonerNames[i] === authService.summonerName()) {
              $scope.error.summonerNames[i] = true;
              $rootScope.$broadcast('flashError', 'You already are a member of this League since it is not a spectator league');
              foundError = true;
              break;
            } else {
              for (var j = i + 1; j < summonerCount; j++) {
                if ($scope.summonerNames[i] === $scope.summonerNames[j]) {
                  $scope.error.summonerNames[i] = true;
                  $scope.error.summonerNames[j] = true;
                  $rootScope.$broadcast('flashError', 'League cannot contain two identical members');
                  foundError = true;
                  break;
                }
              }
            }
          }

          if (!foundError) {
            isWorking = true;
            var postData = {
              leagueName: $scope.leagueName,
              summonerNames: [],
              isSpectatorLeague: $scope.isSpectatorLeague,
            };
            for (var i = 0; i < summonerCount; i++) {
              postData.summonerNames.push($scope.summonerNames[i]);
            }
            $http.post('api/CreateLeague', postData).then(function(response) {
              if (response.data.success) {
                $location.path('Leagues');
                $rootScope.$broadcast('flashSuccess', 'Successfully created League \'' + $scope.leagueName + '\'');
              } else {
                $rootScope.$broadcast('flashError', response.data.reason);
              }
              isWorking = false;
            }, function(response) {
              $rootScope.$broadcast('flashError', 'Server responded with status code ' + response.status);
              isWorking = false;
            });
          }
        }
      }
    }
  }
]);
