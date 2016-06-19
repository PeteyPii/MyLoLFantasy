app.controller('LogInController', ['$rootScope', '$scope', '$http', 'authService',
  function($rootScope, $scope, $http, authService) {
    $scope.username = '';
    $scope.password = '';

    var isWorking = false;

    $scope.logIn = function() {
      if (!isWorking) {
        isWorking = true;
        if (!$scope.username || !$scope.password) {
          $rootScope.$broadcast('flashError', 'You must enter both your username and your password');
        } else if ($scope.username.length > 128) {
          $rootScope.$broadcast('flashError', 'Username is too long');
        } else if ($scope.password.length > 1024) {
          $rootScope.$broadcast('flashError', 'Password is too long');
        } else {
          var postData = {
            username: $scope.username,
            password: $scope.password,
          };
          $http.post('api/LogIn', postData).then(function(response) {
            $scope.password = '';
            if (response.data.success) {
              authService.setProfile(response.data.profile);
            } else {
              $rootScope.$broadcast('flashError', response.data.reason);
            }
            isWorking = false;
          }, function(response) {
            $scope.password = '';
            $rootScope.$broadcast('flashError', 'Server responded with status code ' + response.status);
            isWorking = false;
          });
        }
      }
    };

    $scope.logOut = function() {
    };

    $scope.signUp = function() {
    };
  }
]);
