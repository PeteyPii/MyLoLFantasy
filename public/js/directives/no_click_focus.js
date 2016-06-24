app.directive('noClickFocus', [function(authService) {
  return {
    link: function(scope, element, attrs) {
      element.bind('click', function(event) {
        element[0].blur();
      });
    }
  }
}]);
