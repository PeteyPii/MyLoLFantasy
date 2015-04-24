var fs = require('fs');

var _ = require('lodash');
var Q = require('q');

var dbApi = require('./database.js');

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

  var db = new dbApi(settings.postgre_url);

  db.createDb().fail(function(err) {
    if (err.stack) {
      console.log(err.stack);
    } else {
      console.error('Error: ' + err)
    }
  }).fin(function() {
    db.deinit();
  }).done();
} catch (err) {
  if (err.stack) {
    console.log(err.stack);
  } else {
    console.error('Error: ' + err)
  }
}
