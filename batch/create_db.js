var DB = require('../lib/database.js');
var logger = require('../lib/logger.js');
var settings = require('../lib/settings.js');

try {
  var db = new DB(settings.postgre_url);

  db.createDb().fail(logger.logException).fin(function() {
    return db.deinit();
  }).fail(logger.logException).done();
} catch (err) {
  logger.logException(err);
}
