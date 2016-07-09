var crypto = require('crypto');

var settings = require('./settings.js');

var leagueKey = crypto.pbkdf2Sync(settings.secret_key, 'league', 1000, 128 / 8, 'sha512');

module.exports = {
  encodeLeagueId: function(leagueId) {
    var cipher = crypto.createCipher('bf', leagueKey);
    var buf = new Buffer(8);
    buf.writeDoubleBE(leagueId);
    var length = 8;
    while (buf[length - 1] == 0) {
      length--;
    }
    var encoded = cipher.update(buf.slice(0, length), 'binary', 'base64');
    encoded += cipher.final('base64');
    return encoded.slice(0, encoded.length - 1).replace('/', '-');
  },

  decodeLeagueId: function(cipherText) {
    try {
      cipherText = cipherText.replace('-', '/') + '=';
      var decipher = crypto.createDecipher('bf', leagueKey);
      var buf = Buffer.alloc(8);
      var trimmedBuf = Buffer.concat([decipher.update(cipherText, 'base64'), decipher.final()]);
      trimmedBuf.copy(buf);
      return buf.readDoubleBE(0);
    } catch (e) {
      return -1;
    }
  },
};
