var fs = require('fs');

var _ = require('lodash');
var Q = require('q');

var db = require('./database.js');

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

  db.createDb(settings.postgre_url).then(function() {
    db.closeDb();
  }).done();
} catch (err) {
  console.log("Error: " + err);
}
