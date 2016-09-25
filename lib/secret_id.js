var assert = require('assert');
var crypto = require('crypto');

var _ = require('lodash');
var BigNumber = require('bignumber.js');

var settings = require('./settings.js');

var leagueKey = crypto.pbkdf2Sync(settings.secret_key, 'league', 1000, 128 / 8, 'sha512');

// Alphabet to use for encoded IDs. Some visually ambiguous characters like 'I' and 'l' are omitted.
var ALPHABET = '23456789abcdefghijkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ';

// Calculates the alphabet that BigNumber uses at runtime in case it ever changes.
var bigNumAlphaDigits = [];
for (var digit = 0; digit < ALPHABET.length; digit++) {
  bigNumAlphaDigits.push((new BigNumber(digit)).toString(ALPHABET.length));
}
bigNumAlphaDigits = bigNumAlphaDigits.join('');
assert(bigNumAlphaDigits.length == ALPHABET.length);

var bigNumToMlfAlphabet = {};
var mlfAlphabetTobigNum = {};
for (var ix = 0; ix < ALPHABET.length; ix++) {
  bigNumToMlfAlphabet[bigNumAlphaDigits[ix]] = ALPHABET[ix];
  mlfAlphabetTobigNum[ALPHABET[ix]] = bigNumAlphaDigits[ix];
}

module.exports = {
  encodeLeagueId: function(leagueId) {
    var cipher = crypto.createCipher('bf', leagueKey);
    var buf = new Buffer(8);
    buf.writeDoubleBE(leagueId);
    var length = 8;
    while (buf[length - 1] === 0) {
      length--;
    }
    var encodedBytes = Buffer.concat([cipher.update(buf.slice(0, length), 'binary'), cipher.final()]);
    if (encodedBytes.length !== 8) {
      throw new Error('Encoded ID should be 8 bytes long.');
    }
    encodedNumber = new BigNumber(0, ALPHABET.length);
    for (var i = 0; i < encodedBytes.length; i++) {
      encodedNumber = encodedNumber.times(256).plus(encodedBytes[i]);
    }
    var encoded = _.map(encodedNumber.toString(ALPHABET.length), function(char) {
      return bigNumToMlfAlphabet[char];
    }).join('');
    return encoded;
  },

  decodeLeagueId: function(cipherText) {
    try {
      cipherText = _.map(cipherText, function(char) {
        return mlfAlphabetTobigNum[char];
      }).join('');
      var encodedNumber = new BigNumber(cipherText, ALPHABET.length);
      var encodedBytes = new Buffer(8);
      for (var i = encodedBytes.length - 1; i >= 0; i--) {
        encodedBytes[i] = encodedNumber.modulo(256);
        encodedNumber = encodedNumber.dividedToIntegerBy(256);
      }
      var decipher = crypto.createDecipher('bf', leagueKey);
      var buf = Buffer.alloc(8);
      var trimmedBuf = Buffer.concat([decipher.update(encodedBytes), decipher.final()]);
      trimmedBuf.copy(buf);
      return buf.readDoubleBE(0, true);
    } catch (e) {
      return -1;
    }
  },
};
