app.controller('LeagueController', ['$rootScope', '$scope', '$routeParams', '$http', '$location', 'ngDialog', 'localStorageService',
  function($rootScope, $scope, $routeParams, $http, $location, ngDialog, localStorageService) {
    var DISPLAY_TYPE_KEY = 'league_display_type';
    var TOTAL_ID = 'total';
    var AVG_ID = 'average';

    $rootScope.setActiveNavLink('league');
    $rootScope.title = 'Leagues';

    $scope.isLoading = true;
    $scope.loadError = false;
    $scope.exists = false;
    $scope.league = {};
    $scope.totalData = {};
    $scope.perGameData = {};
    $scope.activeData = {};

    setActiveData();

    $http.get('api/Leagues/' + $routeParams.leagueId).then(function(response) {
      $scope.isLoading = false;
      $scope.exists = true;
      $scope.league = response.data;
      $scope.totalData = _.cloneDeep($scope.league.data);
      var summoner;
      for (summoner in $scope.totalData) {
        $scope.totalData[summoner].points = $scope.totalData[summoner].points.toFixed(2);
      }
      $scope.perGameData = _.cloneDeep($scope.league.data);
      for (summoner in $scope.perGameData) {
        $scope.perGameData[summoner].points = averageValue($scope.perGameData[summoner].points, $scope.league.gameCount);
        var stats = $scope.perGameData[summoner].stats;
        for (var stat in stats) {
          stats[stat] = averageValue(stats[stat], $scope.league.gameCount);
        }
      }
      $scope.activeData = $scope.totalData;

      setActiveData();
    }, function(response) {
      $scope.isLoading = false;
      if (response.status === 404) {
        // $scope is set up to imply the League does not exist.
      } else {
        $scope.loadError = true;
        $rootScope.$broadcast('flashError', 'Server responded with status code ' + response.status);
      }
    });

    $scope.updateDisplayType = function() {
      if ($scope.activeData === $scope.totalData) {
        localStorageService.set(DISPLAY_TYPE_KEY, TOTAL_ID);
      } else if ($scope.activeData === $scope.perGameData) {
        localStorageService.set(DISPLAY_TYPE_KEY, AVG_ID);
      }
    };

    function averageValue(value, count) {
      return (value / count).toFixed(2);
    }

    function setActiveData() {
      switch (localStorageService.get(DISPLAY_TYPE_KEY)) {
        case TOTAL_ID:
          $scope.activeData = $scope.totalData;
          break;
        case AVG_ID:
          $scope.activeData = $scope.perGameData;
          break;
        default:
          $scope.activeData = $scope.totalData;
          break;
      }
    }
  }
]);
