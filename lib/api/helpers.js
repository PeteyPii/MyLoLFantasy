module.exports = {
  createProfileData: function(user) {
    if (user) {
      return {
        isLoggedIn: true,
        username: user.username,
        summonerName: user.summonerName,
      };
    } else {
      return {
        isLoggedIn: false,
      };
    }
  },

  verifyCsrfToken: function(req, res, next) {
    if (req.cookies.csrf !== req.get('X-CSRF-Token')) {
      res.status(403);
      res.send('Unauthorized');
    } else {
      next();
    }
  },
};
