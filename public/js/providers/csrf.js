app.provider('csrf', [
  function() {
    this.$get = ['$cookies',
      function($cookies) {
        return {
          request: function(config) {
            if (config.method !== 'GET') {
              config.headers['X-CSRF-Token'] = $cookies.get('csrf');
            }
            return config;
          }
        }
      }
    ];
  }
])
