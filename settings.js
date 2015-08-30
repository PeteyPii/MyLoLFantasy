var path = require('path');

var _ = require('lodash');

var settings = {};

try {
  var defaults = require(path.join(__dirname, 'defaults.json'));
  _.assign(settings, defaults);
} catch (err) {
  // Silently ignore (in case the file is missing)
}

try {
  var userSettings = require(path.join(__dirname, 'settings.json'));
  _.assign(settings, userSettings);
} catch (err) {
  // Silently ignore (in case the file is missing)
}

function validateSettings(settings) {
  var requiredSettings = [
    'lol_api_key',
    'refresh_period',
    'postgre_url',
    'secret_key',
    'lol_burst_requests',
    'lol_burst_period',
    'password_hash_rounds',
    'server_http_port',
    'server_https_port',
    'redirect_default_port',
  ];

  for (var i = 0; i < requiredSettings.length; i++) {
    if (typeof settings[requiredSettings[i]] == 'undefined')
      throw new Error('Missing setting \'' + requiredSettings[i] + '\'');
  }

  function isValidPort(port) {
    return _.isNumber(port) &&
      port > 0 && port < 65536 &&
      port === port | 0;
  }

  if (!_.isString(settings.lol_api_key) || !settings.lol_api_key.match(/^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i))
    throw new Error('LoL API key looks incorrect. Should look like\n' +
      'XXXXXXXX-XXXX-XXXX-XXXX-XXXXXXXXXXXX rather than yours which is\n' +
      settings.lol_api_key);
  if (!_.isNumber(settings.refresh_period) || settings.refresh_period < 0)
    throw new Error('Refresh period needs to be a non-negative number');
  if (!_.isString(settings.postgre_url))
    throw new Error('PostgreSQL URL must be a string');
  if (!_.isString(settings.secret_key))
    throw new Error('Secret key must be a string (and it should be very random!)');
  if (!_.isNumber(settings.lol_burst_requests) || (settings.lol_burst_requests !== settings.lol_burst_requests | 0) || settings.lol_burst_requests <= 0)
    throw new Error('Number of LoL burst requests should be a positive integer');
  if (!_.isNumber(settings.lol_burst_period) || (settings.lol_burst_period !== settings.lol_burst_period | 0) || settings.lol_burst_period < 0)
    throw new Error('LoL burst request period must be a a non-negative integer');
  if (!_.isNumber(settings.password_hash_rounds) || (settings.password_hash_rounds !== settings.password_hash_rounds | 0) || settings.password_hash_rounds < 1)
    throw new Error('Password hash rounds must be an integer greater than zero');
  if (!isValidPort(settings.server_http_port))
    throw new Error('Port for HTTP server must be valid');
  if (!isValidPort(settings.server_https_port))
    throw new Error('Port for HTTPS server must be valid');
  if (!_.isBoolean(settings.redirect_default_port))
    throw new Error('Redirection to default port must be either `true` or `false`');
}

try {
  validateSettings(settings);
} catch (err) {
  if (err.stack) {
    console.error(err.stack);
  } else {
    console.error('Error: ' + err);
  }

  // Just stop everything and tell the user they need to fix their settings
  process.kill(process.pid);
}

module.exports = settings;