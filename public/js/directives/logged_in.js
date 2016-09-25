app.directive('loggedIn', ['authService', function(authService) {
  return {
    link: function(scope, element, attrs) {
      var requiredLogInState;
      if (attrs.loggedIn === 'true') {
        requiredLogInState = true;
      } else if (attrs.loggedIn === 'false') {
        requiredLogInState = false;
      } else {
        throw 'loggedIn value must be either "true" or "false"';
      }

      function toggleVisibilityBasedOnLogIn() {
        if (authService.isLoggedIn() == requiredLogInState) {
          element.removeClass('hidden');
        } else {
          element.addClass('hidden');
        }
      }

      toggleVisibilityBasedOnLogIn();
      scope.$on('profileChanged', toggleVisibilityBasedOnLogIn);
    }
  };
}]);
