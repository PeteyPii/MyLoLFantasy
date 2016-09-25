app.controller('AboutController', ['$rootScope', '$scope',
  function($rootScope, $scope) {
    $rootScope.setActiveNavLink('about');
    $rootScope.title = 'About';
  }
]);
