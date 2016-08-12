app.controller('LeagueController', ['$rootScope', '$scope', '$routeParams', '$http', '$location', 'ngDialog', 'localStorageService',
  function($rootScope, $scope, $routeParams, $http, $location, ngDialog, localStorageService) {
    var DISPLAY_TYPE_KEY = 'league_display_type';
    var DisplayType = {
      TOTAL: 'total',
      AVG: 'average',
    };

    $rootScope.setActiveNavLink('league');
    $rootScope.title = 'Leagues';

    $scope.isLoading = true;
    $scope.loadError = false;
    $scope.exists = false;

    $scope.league = null;
    $scope.totalData = null;
    $scope.perGameData = null;
    $scope.activeData = null;

    setActiveData();

    $scope.Column = {
      NAME: 'name',
      KDA: 'kda',
      CS: 'cs',
      TURRETS: 'turrets',
      DOUBLES: 'doubles',
      TRIPLES: 'triples',
      QUADRAS: 'quadras',
      PENTAS: 'pentas',
      POINTS: 'points',
      NONE: 'none',
    };

    $scope.sortedColumn = $scope.Column.NONE;
    $scope.ascendingSort = true;
    $scope.activateColumnForSorting = function(column) {
      if ($scope.sortedColumn === column) {
        $scope.ascendingSort = !$scope.ascendingSort;
        reverseAllData();
      } else {
        $scope.sortedColumn = column;
        switch ($scope.sortedColumn) {
          case $scope.Column.NAME:
            $scope.ascendingSort = true;
            sortAllData(function(summonerDataPair) {
              return summonerDataPair[0];
            });
            break;
          case $scope.Column.KDA:
            $scope.ascendingSort = false;
            sortAllData(function(summonerDataPair) {
              var stats = summonerDataPair[1].stats;
              var kills = parseFloat(stats.championKills);
              var deaths = parseFloat(stats.deaths);
              var assists = parseFloat(stats.assists);
              var kda;
              if (deaths === 0) {
                kda = kills + asssits;
                kda = '1' + pad(kda.toFixed(20), 40);  // prepend a '1' so that it sorts above KDAs for deaths == 1
              } else {
                kda = (kills + assists) / deaths;
                kda = '0' + pad(kda.toFixed(20), 40);  // prepend a '0' so that it sorts below KDAs for deaths == 0
              }
              return kda;
            });
            // We want descending order.
            reverseAllData();
            break;
          case $scope.Column.CS:
            $scope.ascendingSort = false;
            sortAllData(function(summonerDataPair) {
              // Negative for descending.
              return -summonerDataPair[1].stats.minionKills;
            });
            break;
          case $scope.Column.TURRETS:
            $scope.ascendingSort = false;
            sortAllData(function(summonerDataPair) {
              // Negative for descending.
              return -summonerDataPair[1].stats.turretKills;
            });
            break;
          case $scope.Column.DOUBLES:
            $scope.ascendingSort = false;
            sortAllData(function(summonerDataPair) {
              // Negative for descending.
              return -summonerDataPair[1].stats.doubleKills;
            });
            break;
          case $scope.Column.TRIPLES:
            $scope.ascendingSort = false;
            sortAllData(function(summonerDataPair) {
              // Negative for descending.
              return -summonerDataPair[1].stats.tripleKills;
            });
            break;
          case $scope.Column.QUADRAS:
            $scope.ascendingSort = false;
            sortAllData(function(summonerDataPair) {
              // Negative for descending.
              return -summonerDataPair[1].stats.quadraKills;
            });
            break;
          case $scope.Column.PENTAS:
            $scope.ascendingSort = false;
            sortAllData(function(summonerDataPair) {
              // Negative for descending.
              return -summonerDataPair[1].stats.pentaKills;
            });
            break;
          case $scope.Column.POINTS:
            $scope.ascendingSort = false;
            sortAllData(function(summonerDataPair) {
              // Negative for descending.
              return -summonerDataPair[1].points;
            });
            break;
          default:
            throw new Error('Invalid column value');
        }
      }
    };

    $scope.activateColumnForSorting($scope.Column.NAME);

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

      $scope.totalData = dataToArray($scope.totalData);
      $scope.perGameData = dataToArray($scope.perGameData);
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
        localStorageService.set(DISPLAY_TYPE_KEY, DisplayType.TOTAL);
      } else if ($scope.activeData === $scope.perGameData) {
        localStorageService.set(DISPLAY_TYPE_KEY, DisplayType.AVG);
      }
    };

    function averageValue(value, count) {
      return (value / count).toFixed(2);
    }

    function dataToArray(data) {
      var dataAsArray = [];
      for (var summoner in data) {
        dataAsArray.push([summoner, data[summoner]]);
      }
      return dataAsArray;
    }

    function pad(n, width) {
      n = n + '';
      return n.length >= width ? n : new Array(width - n.length + 1).join('0') + n;
    }

    function setActiveData() {
      switch (localStorageService.get(DISPLAY_TYPE_KEY)) {
        case DisplayType.TOTAL:
          $scope.activeData = $scope.totalData;
          break;
        case DisplayType.AVG:
          $scope.activeData = $scope.perGameData;
          break;
        default:
          $scope.activeData = $scope.totalData;
          break;
      }
    }

    function sortAllData(predicate) {
      $scope.totalData = _.sortBy($scope.totalData, predicate);
      $scope.perGameData = _.sortBy($scope.perGameData, predicate);
      setActiveData();
    }

    function reverseAllData() {
      $scope.totalData.reverse();
      $scope.perGameData.reverse();
    }
  }
]);
