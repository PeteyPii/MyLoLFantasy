app.controller('SignUpController', ['$scope', '$rootScope', '$http', '$location', 'authService',
  function ($scope, $rootScope, $http, $location, authService) {
    $rootScope.setActiveNavLink('none');
    $rootScope.title = 'Sign Up';

    $scope.username = '';
    $scope.password = '';
    $scope.confirmPassword = '';
    $scope.email = '';
    $scope.summonerName = '';
    $scope.agree = true;

    $scope.error = {
      username: false,
      password: false,
      confirmPassword: false,
      email: false,
      summonerName: false,
      agree: false,
    };

    var isWorking = false;
    $scope.signUp = function() {
      if (!isWorking) {
        $scope.error = {
          username: false,
          password: false,
          confirmPassword: false,
          email: false,
          summonerName: false,
          agree: false,
        };

        if (!$scope.username) {
          $scope.error.username = true;
          $rootScope.$broadcast('flashError', 'You must enter a username');
        } else if ($scope.username.length > 128) {
          $scope.error.username = true;
          $rootScope.$broadcast('flashError', 'Username cannot be longer than 128 characters');
        } else if (!$scope.password || !$scope.confirmPassword) {
          $scope.error.password = true;
          $scope.error.confirmPassword = true;
          $rootScope.$broadcast('flashError', 'You must enter and confirm your password');
        } else if ($scope.password != $scope.confirmPassword) {
          $scope.error.password = true;
          $scope.error.confirmPassword = true;
          $rootScope.$broadcast('flashError', 'Passwords do not match');
        } else if ($scope.password.length > 1024) {
          $scope.error.password = true;
          $rootScope.$broadcast('flashError', 'Password cannot be longer than 1024 characters');
        } else if ($scope.email.length > 128) {
          $scope.error.email = true;
          $rootScope.$broadcast('flashError', 'Email cannot be longer than 128 characters');
        } else if (!$scope.summonerName) {
          $scope.error.summonerName = true;
          $rootScope.$broadcast('flashError', 'You must enter your summoner name');
        } else if ($scope.summonerName.length > 128) {
          $scope.error.summonerName = true;
          $rootScope.$broadcast('flashError', 'Summoner name cannot be longer than 128 characters');
        } else if (!$scope.agree) {
          $scope.error.agree = true;
          $rootScope.$broadcast('flashError', 'You must accept the agreement');
        } else {
          isWorking = true;
          var postData = {
            username: $scope.username,
            password: $scope.password,
            confirmPassword: $scope.confirmPassword,
            email: $scope.email,
            summonerName: $scope.summonerName,
            agree: $scope.agree,
          };

          $http.post('api/sign-up', postData).then(function(response) {
            $scope.password = '';
            $scope.confirmPassword = '';
            if (response.data.success) {
              authService.setProfile(response.data.profile);
              $location.path('home');
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
