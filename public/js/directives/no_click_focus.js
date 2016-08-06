app.directive('noClickFocus', [function() {
  return {
    link: function(scope, element, attrs) {
      element.bind('click', function(event) {
        element[0].blur();
      });
    }
  }
}]);
