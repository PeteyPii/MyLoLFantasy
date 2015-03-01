var _ = require('lodash');
var fs = require('fs');
var url = require('url');
var http = require('http');

try {
  var settings = {}

  try {
    var data = fs.readFileSync('defaults.json');
    settings = _.assign(settings, JSON.parse(data));
  } catch (err) {
    // We don't care if the file doesn't exist since the user might define everything
    // in the user defined settings file.
  }

  try {
    var data = fs.readFileSync('settings.json');
    settings = _.assign(settings, JSON.parse(data));
  } catch (err) {
    // We don't care if the file doesn't exist since the user might define everything
    // in the default settings file.
  }

  var requiredSettings = [
    'lol_api_key',
    'refresh_period',
    'port'
  ];

  // Check for existence of all required settings
  for (var i = 0; i < requiredSettings.length; i++) {
    if (typeof settings[requiredSettings[i]] == 'undefined')
      throw 'Missing setting \'' + requiredSettings[i] + '\'';
  }

  // Check values of all settings
  if (!_.isString(settings.lol_api_key) || !settings.lol_api_key.match(/^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i))
    throw 'LoL API key looks incorrect. Should look like\n' +
          'XXXXXXXX-XXXX-XXXX-XXXX-XXXXXXXXXXXX rather than yours which is\n' +
          settings.lol_api_key;
  if (!_.isFinite(settings.refresh_period) || settings.refresh_period < 0)
    throw 'Refresh period needs to be a non-negative number';
  if (!_.isFinite(settings.keep_alive_timeout) || settings.refresh_period <= 0)
    throw 'Keep alive timeout needs to be a postive number';
  if (!_.isFinite(settings.port) || settings.port != (settings.port | 0) || settings.port >= 65536 || settings.port < 0)
    throw 'Port must be a non-negative integer below 65536';

  var server = http.createServer(function(request, response) {
    var subHandlers = {
      '/': function(params) {
        return 'base';
      },

      '/groups': function(params) {
        return 'groups'
      },

      '/shutdown': function(params) {
        setTimeout(function() { server.close(function(err) {}); }, 1);
        console.log('Server shutting down');
        return 'Server will now shutdown';
      },
    };

    var parsedUrl = url.parse(request.url, true);

    if (!subHandlers[parsedUrl.pathname]) {
      response.writeHead(404);
      response.end();
      return;
    }

    response.writeHead(200, {'Content-Type': 'text/plain'});
    response.end(subHandlers[parsedUrl.pathname](parsedUrl.query));
  }).listen(settings.port);
  server.addListener('connection', function(stream) {
    stream.setTimeout(settings.keep_alive_timeout);
  });

  console.log('Server started running');
} catch (err) {
  console.log("Error: " + err);
}
