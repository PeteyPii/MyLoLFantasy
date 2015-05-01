var fs = require('fs');

var _ = require('lodash');
var Q = require('q');

var dbApi = require('./database.js');

try {
  settings = _.assign(settings, require('./defaults.json'), require('./settings.json'));

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
