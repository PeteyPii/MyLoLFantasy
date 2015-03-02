var Q = require('q');
var pg = require('pg');

var DB_VERSION = '\'1.0\'';

var DB_VERSION_TABLE =
  'CREATE TABLE version (' +
    'version          text PRIMARY KEY' +
  ');';

var DB_USERS_TABLE =
  'CREATE TABLE users (' +
    'username         TEXT PRIMARY KEY,' +
    'summoner         TEXT,' +
    'password_hash    TEXT' +
  ');';

var DB_GROUPS_TABLE =
  'CREATE TABLE groups (' +
    'id               SERIAL PRIMARY KEY,' +
    'name             TEXT,' +
    'owner            TEXT REFERENCES users (username) ON DELETE CASCADE,' +
    'stats            TEXT,' +
    'creation_time    TIMESTAMP,' +
    'matches_tracked  TEXT[]' +
  ');';

var postgreConfig = {};

module.exports = {
  init: function(connectionUrl) {
    postgreConfig.connectionUrl = connectionUrl;

    return Q.Promise(function(resolve, reject) {
      pg.connect(postgreConfig.connectionUrl, function(err, client, done) {
        if (err) {
          reject(err);
        } else {
          resolve(client, done);
        }
      });
    }).then(function(client, done) {
      return Q.Promise(function(resolve, reject) {
        // client.query('SELECT version FROM version', function(err, result)
      });
    });
  },

  closeDb: function() {
    pg.end();
  },

  createDb: function(connectionUrl) {
    postgreConfig.connectionUrl = connectionUrl;

    var clientDone;
    return Q.Promise(function(resolve, reject) {
      pg.connect(postgreConfig.connectionUrl, function(err, client, done) {
        if (err) {
          console.error(err);
          reject(err);
        } else {
          clientDone = done;
          resolve(client);
        }
      });
    }).then(function(client) {

      // Drop tables in correct order
      return Q.Promise(function(resolve, reject) {
        client.query('DROP TABLE groups;', function(err, result) {
          resolve(client);
        });
      });
    }).then(function(client) {
      return Q.Promise(function(resolve, reject) {
        client.query('DROP TABLE version;', function(err, result) {
          resolve(client);
        });
      });
    }).then(function(client) {
      return Q.Promise(function(resolve, reject) {
        client.query('DROP TABLE users;', function(err, result) {
          resolve(client);
        });
      });
    }).then(function(client) {

      // Create and init version table
      return Q.Promise(function(resolve, reject) {
        client.query(DB_VERSION_TABLE, function(err, result) {
          if (err) {
            reject(err);
          } else {
            resolve(client);
          }
        });
      });
    }).then(function(client) {
      return Q.Promise(function(resolve, reject) {
        client.query('INSERT INTO version (version) VALUES (' + DB_VERSION + ')', function(err, result) {
          if (err) {
            reject(err);
          } else {
            resolve(client);
          }
        });
      });
    }).then(function(client) {

      // Create users table
      return Q.Promise(function(resolve, reject) {
        client.query(DB_USERS_TABLE, function(err, result) {
          if (err) {
            reject(err);
          } else {
            resolve(client);
          }
        });
      });
    }).then(function(client) {

      // Create groups table
      return Q.Promise(function(resolve, reject) {
        client.query(DB_GROUPS_TABLE, function(err, result) {
          if (err) {
            reject(err);
          } else {
            resolve();
          }
        });
      });
    }).finally(function() {
      if (clientDone) {
        clientDone();
      }
    });
  },

  updateDb: function(version) {
  },
};
