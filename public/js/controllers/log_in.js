app.controller('LogInController', ['$rootScope', '$scope', '$http', '$location', 'authService',
  function($rootScope, $scope, $http, $location, authService) {
    $scope.username = '';
    $scope.password = '';

    $scope.error = {
      username: false,
      password: false,
    };

    $scope.displayUsername = authService.username();

    var isWorking = false;

    $scope.logIn = function() {
      if (!isWorking) {
        if (!$scope.username) {
          $scope.error.username = true;
          $rootScope.$broadcast('flashError', 'You must enter your username');
        } else if (!$scope.password) {
          $scope.error.password = true;
          $rootScope.$broadcast('flashError', 'You must enter your password');
        } else if ($scope.username.length > 128) {
          $scope.error.username = true;
          $rootScope.$broadcast('flashError', 'Username is too long');
        } else if ($scope.password.length > 1024) {
          $scope.error.password = true;
          $rootScope.$broadcast('flashError', 'Password is too long');
        } else {
          isWorking = true;
          var postData = {
            username: $scope.username,
            password: $scope.password,
          };
          $http.post('api/LogIn', postData).then(function(response) {
            $scope.password = '';
            if (response.data.success) {
              $scope.username = '';
              $scope.error = {
                username: false,
                password: false,
              };
              authService.setProfile(response.data.profile);
              $scope.displayUsername = authService.username();
            } else {
              $scope.error.username = true;
              $scope.error.password = true;
              $rootScope.$broadcast('flashError', response.data.reason);
            }
            isWorking = false;
          }, function(response) {
            $rootScope.$broadcast('flashError', 'Server responded with status code ' + response.status);
            isWorking = false;
          });
        }
      }
    };

    $scope.logOut = function() {
      if (!isWorking) {
        isWorking = true;
        $http.post('api/LogOut', {}).then(function(response) {
          if (response.data.success) {
            authService.setProfile(response.data.profile);
          } else {
            $rootScope.$broadcast('flashError', response.data.reason);
          }
          isWorking = false;
        }, function(response) {
          $rootScope.$broadcast('flashError', 'Server responded with status code ' + response.status);
          isWorking = false;
        });
      }
    };

    $scope.signUp = function() {
      if (!isWorking) {
        $location.path('SignUp');
      }
    };
  }
]);
