app.controller('HomeController', ['$scope', '$rootScope',
  function ($scope, $rootScope) {
    $rootScope.setActiveNavLink('home');
    $rootScope.title = 'Home';
  }
]);
