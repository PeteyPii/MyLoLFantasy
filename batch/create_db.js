var DB = require('../lib/database.js');
var logger = require('../lib/logger.js');

try {
  var db = new DB();

  db.createDb().fail(logger.logException).fin(function() {
    return db.deinit();
  }).fail(logger.logException).done();
} catch (err) {
  logger.logException(err);
}
