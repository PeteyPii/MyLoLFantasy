app.directive('noEmailValidation', function() {
  return {
    require : 'ngModel',
    link: function(scope, element, attrs, ngModel) {
      ngModel.$validators["email"] = function() {
        return true;
      };
    },
  };
});
