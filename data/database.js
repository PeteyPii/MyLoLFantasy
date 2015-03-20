var Q = require('q');
var pg = require('pg');

var DB_VERSION = '1.0.0';

var DB_VERSION_TABLE =
  'CREATE TABLE version (' +
    'version          TEXT PRIMARY KEY' +
  ');';

var DB_USERS_TABLE =
  'CREATE TABLE users (' +
    'username         TEXT PRIMARY KEY,' +
    'summoner         TEXT NOT NULL,' +
    'email            TEXT NOT NULL UNIQUE,' +
    'password_hash    TEXT NOT NULL' +
  ');';

var DB_GROUPS_TABLE =
  'CREATE TABLE groups (' +
    'id               SERIAL PRIMARY KEY,' +
    'name             TEXT NOT NULL,' +
    'owner            TEXT NOT NULL REFERENCES users (username) ON DELETE CASCADE,' +
    'stats            TEXT NOT NULL,' +
    'creation_time    TIMESTAMP NOT NULL,' +
    'matches_tracked  TEXT[] NOT NULL' +
  ');';

// All methods return Q promises
var dbApi = {
  config: {},
  init: function(connectionUrl) {
    var self = this;
    var clientDone;

    self.config.connectionUrl = connectionUrl;

    return Q.ninvoke(pg, 'connect', self.config.connectionUrl).then(function(values) {
      var client = values[0];
      clientDone = values[1];

      return client;
    }).then(function(client) {
      return Q.ninvoke(client, 'query', 'SELECT version FROM version;').then(function(result) {
        if (!result.rows.length) {
          throw 'Database version is faulty. Please recreate your database';
        } else if (result.rows[0].version != DB_VERSION) {
          return self.updateDb();
        }
      });
    }).fin(function() {
      if (clientDone) {
        clientDone();
      }
    });
  },

  deinit: function() {
    return Q.Promise(function(resolve, reject) {
      pg.end();
      resolve();
    });
  },

  createDb: function(connectionUrl) {
    var clientDone;

    this.config.connectionUrl = connectionUrl;

    return Q.ninvoke(pg, 'connect', this.config.connectionUrl).then(function(values) {
      var client = values[0];
      clientDone = values[1];

      return client;
    }).then(function(client) {

      // Drop tables in correct order. We silently ignore errors since if the table doesn't
      // exist we don't care.
      return Q.Promise(function(resolve, reject) {
        client.query('DROP TABLE groups;', function(err, result) {
          resolve();
        });
      }).then(function() {
        return Q.Promise(function(resolve, reject) {
          client.query('DROP TABLE version;', function(err, result) {
            resolve();
          });
        });
      }).then(function() {
        return Q.Promise(function(resolve, reject) {
          client.query('DROP TABLE users;', function(err, result) {
            resolve();
          });
        });
      }).then(function() {

        // Create and init all the tables
        return Q.ninvoke(client, 'query', DB_VERSION_TABLE);
      }).then(function() {
        return Q.ninvoke(client, 'query', 'INSERT INTO version (version) VALUES (\'' + DB_VERSION + '\');');
      }).then(function() {
        return Q.ninvoke(client, 'query', DB_USERS_TABLE);
      }).then(function() {
        return Q.ninvoke(client, 'query', DB_GROUPS_TABLE);
      });
    }).fin(function() {
      if (clientDone) {
        clientDone();
      }
    });
  },

  updateDb: function(version) {
    return Q.Promise(function(resolve, reject) {
      reject('Automatically updating the DB is not functional yet. Aborting...');
    });
  },

  /***********/
  /* Version */
  /***********/

  // Returns DB version as a string
  getVersion: function() {
    var clientDone;

    return Q.ninvoke(pg, 'connect', this.config.connectionUrl).then(function(values) {
      var client = values[0];
      clientDone = values[1];

      return client;
    }).then(function(client) {
      return Q.ninvoke(client, 'query', 'SELECT version FROM version;').then(function(result) {
        if (!result.rows.length) {
          throw 'getVersion failed';
        }

        return result.rows[0].version;
      });
    }).fin(function() {
      if (clientDone) {
        clientDone();
      }
    });
  },

  /*********/
  /* Users */
  /*********/

  createUser: function() {
  },
};

module.exports = dbApi;
