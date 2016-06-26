app.controller('FlashController', ['$rootScope', '$scope',
  function($rootScope, $scope) {
    $scope.messages = [];

    $scope.close = function(index) {
      $scope.messages.splice(index, 1);
    }

    $scope.$on('flashError', function(event, messageText) {
      $scope.messages.push({
        type: 'error',
        text: messageText,
      });
    });

    $scope.$on('flashSuccess', function(event, messageText) {
      $scope.messages.push({
        type: 'success',
        text: messageText,
      });
    });
  }
]);
