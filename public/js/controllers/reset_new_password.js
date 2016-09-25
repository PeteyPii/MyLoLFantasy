app.controller('ResetNewPasswordController', ['$scope', '$rootScope', '$routeParams', '$http', '$location',
  function ($scope, $rootScope, $routeParams, $http, $location) {
    $rootScope.setActiveNavLink('none');
    $rootScope.title = 'Reset Password';

    $scope.isLoading = true;
    $http.get('api/reset-password/' + $routeParams.token).then(function(response) {
      $scope.isLoading = false;
    }, function(response) {
      if (response.status === 404) {
        $rootScope.$broadcast('flashError', 'Password reset token is expired or invalid.');
      } else {
        $rootScope.$broadcast('flashError', 'Server responded with status code ' + response.status);
      }
      $location.path('home').replace();
    });

    $scope.password = '';
    $scope.confirmPassword = '';

    $scope.error = {
      password: false,
      confirmPassword: false,
    };

    var isWorking = false;
    $scope.submit = function() {
      if (!isWorking && !$scope.isLoading) {
        $scope.error.password = false;
        $scope.error.confirmPassword = false;
        if (!$scope.password) {
          $scope.error.password = true;
          $rootScope.$broadcast('flashError', 'You must enter a password.');
        } else if (!$scope.confirmPassword) {
          $scope.error.confirmPassword = true;
          $rootScope.$broadcast('flashError', 'You must confirm your password.');
        } else if ($scope.password !== $scope.confirmPassword) {
          $scope.error.password = true;
          $scope.error.confirmPassword = true;
          $rootScope.$broadcast('flashError', 'Passwords do not match.');
        } else if ($scope.password.length > 128) {
          $scope.error.password = true;
          $scope.error.confirmPassword = true;
          $rootScope.$broadcast('flashError', 'Password cannot be longer than 128 characters.');
        } else {
          var postData = {
            password: $scope.password,
          };
          $http.post('api/reset-password/' + $routeParams.token, postData).then(function(response) {
            $scope.password = '';
            $scope.confirmPassword = '';
            if (response.data.success) {
              $rootScope.$broadcast('flashSuccess', 'Your password has been successfully changed. Log in to your account to access your Leagues.');
              $location.path('home');
            } else {
              $rootScope.$broadcast('flashError', response.data.reason);
            }
            isWorking = false;
          }, function(response) {
            $scope.password = '';
            $scope.confirmPassword = '';
            $rootScope.$broadcast('flashError', 'Server responded with status code ' + response.status);
            isWorking = false;
          });
        }
      }
    };
  }
]);
