app.controller('FlashController', ['$rootScope', '$scope',
  function($rootScope, $scope) {
    $scope.messages = [{
      type: 'error',
      text: 'Test error',
    }, {
      type: 'error',
      text: 'Test error',
    }];

    $scope.close = function(index) {
      $scope.messages.splice(index, 1);
    }
    $scope.$on('flashError', function(event, messageText) {
      $scope.messages.push({
        type: 'error',
        text: messageText,
      });
    });
  }
]);
