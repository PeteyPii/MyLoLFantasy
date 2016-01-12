// Wrappers for the important console logging methods to add timestamps to the logs
var logger = {
  log: function(s) {
    console.log('[' + (new Date()).toLocaleString() + '] ' + s);
  },

  error: function(s) {
    console.error('[' + (new Date()).toLocaleString() + '] ' + s);
  },

  logRequest: function(req) {
    var s = req.protocol.toUpperCase() + ' ' + req.method + ' request from ' + req.ip + ' for resource ' + req.originalUrl;
    logger.log(s);
  },
}

module.exports = logger;
