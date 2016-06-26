app.factory('authService', ['$rootScope',
  function($rootScope) {
    var profile = {};
    return {
      setProfile: function(newProfile) {
        profile = newProfile;
        $rootScope.$broadcast('profileChanged');
      },
      isLoggedIn: function() {
        return profile.isLoggedIn;
      },
      username: function() {
        return profile.username || '';
      },
      summonerName: function() {
        return profile.summonerName || '';
      },
    }
  }
]);
