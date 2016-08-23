app.controller('ResetPasswordController', ['$scope', '$rootScope', '$http', '$location',
  function ($scope, $rootScope, $http, $location) {
    $rootScope.setActiveNavLink('none');
    $rootScope.title = 'Reset Password';

    $scope.username = '';

    $scope.error = {
      username: false,
    };

    var isWorking = false;
    $scope.submit = function() {
      if (!isWorking) {
        $scope.error.username = false;
        if (!$scope.username) {
          $scope.error.username = true;
          $rootScope.$broadcast('flashError', 'You must enter a username.');
        } else if ($scope.username.length > 128) {
          $scope.error.username = true;
          $rootScope.$broadcast('flashError', 'Username cannot be longer than 128 characters.');
        } else {
          var postData = {
            username: $scope.username,
          };
          $http.post('api/ResetPassword', postData).then(function(response) {
            if (response.data.success) {
              $rootScope.$broadcast('flashSuccess', 'A password reset link will be sent to your account\'s linked email address if it exists.');
              $location.path('Home');
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
    };
  }
]);
