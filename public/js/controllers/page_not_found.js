app.controller('MissingPageController', ['$scope', '$rootScope',
  function ($scope, $rootScope) {
    $rootScope.setActiveNavLink('none');
    $rootScope.title = 'Page Does Not Exist';
  }
]);
