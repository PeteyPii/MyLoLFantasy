var pg = require('pg');
var Q = require('q');

var DB_VERSION = '1.0.0';

var DB_VERSION_TABLE =
  'CREATE TABLE version (' +
    'version          TEXT PRIMARY KEY' +
  ');';

var DB_USERS_TABLE =
  'CREATE TABLE users (' +
    'username         TEXT PRIMARY KEY,' +
    'password_hash    TEXT NOT NULL,' +
    'email            TEXT NOT NULL,' +
    'summoner_name    TEXT NOT NULL,' +
    'region           TEXT NOT NULL' +
  ');';

var DB_LEAGUES_TABLE =
  'CREATE TABLE leagues (' +
    'id               SERIAL PRIMARY KEY,' +
    'name             TEXT NOT NULL,' +
    'owner            TEXT NOT NULL REFERENCES users (username) ON DELETE CASCADE,' +
    'stats            TEXT NOT NULL,' +
    'creation_time    TIMESTAMP NOT NULL,' +
    'matches_tracked  TEXT[] NOT NULL' +
  ');';

// All methods return Q promises
function dbApi(connectionUrl) {
  var self = this;

  self.config = {};
  self.config.connectionUrl = connectionUrl;

  self.init = function() {
    var clientDone;

    return Q.ninvoke(pg, 'connect', self.config.connectionUrl).then(function(values) {
      var client = values[0];
      clientDone = values[1];

      return client;
    }).then(function(client) {
      return Q.ninvoke(client, 'query', 'SELECT version FROM version;').then(function(result) {
        if (!result.rows.length) {
          throw 'Database version is faulty. Please recreate your database';
        } else if (result.rows[0].version !== DB_VERSION) {
          return self.updateDb();
        }
      });
    }).fin(function() {
      if (clientDone) {
        clientDone();
      }
    });
  };

  // Call this when doing graceful shutdowns so that the Node process can end
  self.deinit = function() {
    return Q.Promise(function(resolve, reject) {
      pg.end();
      resolve();
    });
  };

  self.createDb = function() {
    var clientDone;

    return Q.ninvoke(pg, 'connect', self.config.connectionUrl).then(function(values) {
      var client = values[0];
      clientDone = values[1];

      // console.log(client);

      return client;
    }).then(function(client) {
      // Drop tables in correct order. We silently ignore errors since if the table doesn't
      // exist we don't care.
      return Q.Promise(function(resolve, reject) {
        client.query('DROP TABLE leagues;', function(err, result) {
          resolve();
        });
      }).then(function() {
        return Q.Promise(function(resolve, reject) {
          client.query('DROP TABLE users;', function(err, result) {
            resolve();
          });
        });
      }).then(function() {
        return Q.Promise(function(resolve, reject) {
          client.query('DROP TABLE version;', function(err, result) {
            resolve();
          });
        });
      })
      .then(function() { return Q.ninvoke(client, 'query', DB_VERSION_TABLE); })
      .then(function() { return Q.ninvoke(client, 'query', 'INSERT INTO version (version) VALUES (\'' + DB_VERSION + '\');'); })
      .then(function() { return Q.ninvoke(client, 'query', DB_USERS_TABLE); })
      .then(function() { return Q.ninvoke(client, 'query', DB_LEAGUES_TABLE); });
    }).fin(function() {
      if (clientDone) {
        clientDone();
      }
    });
  };

  self.updateDb = function(version) {
    return Q.Promise(function(resolve, reject) {
      reject('Automatically updating the DB is not functional yet. Aborting...');
    });
  };

  /***********/
  /* Version */
  /***********/

  // Returns DB version as a string
  self.getVersion = function() {
    var clientDone;

    return Q.ninvoke(pg, 'connect', self.config.connectionUrl).then(function(values) {
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
  };

  /*********/
  /* Users */
  /*********/

  self.createUser = function(username, passwordHash, email, summonerName, region) {
    var clientDone;

    return Q.ninvoke(pg, 'connect', this.config.connectionUrl).then(function(values) {
      var client = values[0];
      clientDone = values[1];

      return client;
    }).then(function(client) {
      var queryParams = {
        name: 'create_user',
        text: 'INSERT INTO users (username, password_hash, email, summoner_name, region) VALUES ($1, $2, $3, $4, $5);',
        values: [username, passwordHash, email, summonerName, region]
      };

      return Q.ninvoke(client, 'query', queryParams);
    }).fin(function() {
      if (clientDone) {
        clientDone();
      }
    });
  };

  // Returns object with error field if user does not exist otherwise it returns
  // an object with the username, summoner_name, email, and password_hash fields
  self.getUser = function(username) {
    var clientDone;

    return Q.ninvoke(pg, 'connect', this.config.connectionUrl).then(function(values) {
      var client = values[0];
      clientDone = values[1];

      return client;
    }).then(function(client) {
      var queryParams = {
        name: 'get_user',
        text: 'SELECT username, summoner_name, email, password_hash FROM users WHERE username = $1;',
        values: [username]
      };

      return Q.ninvoke(client, 'query', queryParams).then(function(result) {
        if (!result.rows.length) {
          return { error: 'User does not exist' };
        } else {
          return result.rows[0];
        }
      });
    }).fin(function() {
      if (clientDone) {
        clientDone();
      }
    });
  };

  // Returns an array of league objects associated with the username. Returns an empty
  // array if the user does not exist or if the user has no leagues. League objects
  // contain the fields: name, owner, creation_time, and matches_tracked
  self.getUsersLeagues = function(username) {
    var clientDone;

    return Q.ninvoke(pg, 'connect', this.config.connectionUrl).then(function(values) {
      var client = values[0];
      clientDone = values[1];

      return client;
    }).then(function(client) {
      var queryParams = {
        name: 'get_users_leagues',
        text: 'SELECT name, owner, stats, creation_time, matches_tracked FROM leagues WHERE owner = $1;',
        values: [username]
      };

      return Q.ninvoke(client, 'query', queryParams).then(function(result) {
        return result.rows;
      });
    }).fin(function() {
      if (clientDone) {
        clientDone();
      }
    });
  };
}

module.exports = dbApi;
