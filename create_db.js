var fs = require('fs');
var path = require('path');

var _ = require('lodash');
var Q = require('q');

var dbApi = require(path.join(__dirname, 'database.js'));

try {
  var settings = {};
  settings = _.assign(settings, require(path.join(__dirname, 'defaults.json')), require(path.join(__dirname, 'settings.json')));

  var db = new dbApi(settings.postgre_url);

  db.createDb().fail(function(err) {
    if (err.stack) {
      console.error(err.stack);
    } else {
      console.error('Error: ' + err)
    }
  }).fin(function() {
    db.deinit();
  }).done();
} catch (err) {
  if (err.stack) {
    console.error(err.stack);
  } else {
    console.error('Error: ' + err)
  }
}
