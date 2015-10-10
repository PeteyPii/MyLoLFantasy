// Wrappers for the important console logging methods to add timestamps to the logs
module.exports = {
  log: function(s) {
    console.log('[' + (new Date()).toLocaleString() + '] ' + s);
  },

  error: function(s) {
    console.error('[' + (new Date()).toLocaleString() + '] ' + s);
  }
}
