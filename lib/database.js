var pg = require('pg');
var Q = require('q');

var settings = require('./settings.js');

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
    'region           TEXT NOT NULL,' +
    'data             TEXT NOT NULL,' +
    'creation_time    TIMESTAMP NOT NULL,' +
    'matches_tracked  TEXT[] NOT NULL' +
  ');';

// All methods return Q promises unless otherwise noted
function DB() {
  var self = this;

  self.config = {
    connectionUrl: settings.postgre_url,
  };

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
      var queryParams = {
        name: 'get_version',
        text: 'SELECT version FROM version',
        values: []
      };

      return Q.ninvoke(client, 'query', queryParams);
    }).then(function(result) {
      if (!result.rows.length) {
        throw 'getVersion failed';
      }

      return result.rows[0].version;
    }).fin(function() {
      if (clientDone) {
        clientDone();
      }
    });
  };

  /*********/
  /* Users */
  /*********/

  // Creates a user with the given fields as arguments. Doesn't return anything
  self.createUser = function(username, passwordHash, email, summonerName, region) {
    var clientDone;

    return Q.ninvoke(pg, 'connect', self.config.connectionUrl).then(function(values) {
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
    }).then(function() {
      // Absorb previous return and return nothing instead
    }).fin(function() {
      if (clientDone) {
        clientDone();
      }
    });
  };

  // Returns false if user does not exist otherwise it returns an object
  // with the username, summoner_name, email, and password_hash fields
  self.getUser = function(username) {
    var clientDone;

    return Q.ninvoke(pg, 'connect', self.config.connectionUrl).then(function(values) {
      var client = values[0];
      clientDone = values[1];

      return client;
    }).then(function(client) {
      var queryParams = {
        name: 'get_user',
        text: 'SELECT username, summoner_name, email, password_hash, region FROM users WHERE username = $1;',
        values: [username]
      };

      return Q.ninvoke(client, 'query', queryParams);
    }).then(function(result) {
      if (!result.rows.length) {
        return false;
      } else {
        return result.rows[0];
      }
    }).fin(function() {
      if (clientDone) {
        clientDone();
      }
    });
  };

  /***********/
  /* Leagues */
  /***********/

  // Creates a League with the given fields as arguments. Uses the postgreSQL now() function to
  // get the current time and sets no matches tracked initially. Doesn't return anything. Data
  // should passed in as an object
  self.createLeague = function(name, owner, region, data) {
    var clientDone;

    return Q.ninvoke(pg, 'connect', self.config.connectionUrl).then(function(values) {
      var client = values[0];
      clientDone = values[1];

      return client;
    }).then(function(client) {
      var queryParams = {
        name: 'create_league',
        text: 'INSERT INTO leagues (name, owner, region, data, creation_time, matches_tracked) VALUES ($1, $2, $3, $4, now(), $5);',
        values: [name, owner, region, JSON.stringify(data), []]
      };

      return Q.ninvoke(client, 'query', queryParams);
    }).then(function() {
      // Absorb previous return and return nothing instead
    }).fin(function() {
      if (clientDone) {
        clientDone();
      }
    });
  };

  // Query database for all Leagues that exist and execute leagueCallback(league) for each one
  // and then finishedCallback() when all the rows have been received. Doesn't return anything.
  // League objects contain the fields: id, name, owner, region, data, creation_time, and
  // matches_tracked
  self.getAllLeagues = function(leagueCallback, finishedCallback) {
    var clientDone;

    Q.ninvoke(pg, 'connect', self.config.connectionUrl).then(function(values) {
      var client = values[0];
      clientDone = values[1];

      return client;
    }).then(function(client) {
      var queryParams = {
        name: 'get_all_leagues',
        text: 'SELECT id, name, owner, region, data, creation_time, matches_tracked FROM leagues;',
        values: []
      };

      var query = client.query(queryParams);

      query.on('row', function(league) {
        league.data = JSON.parse(league.data);
        leagueCallback(league);
      });

      query.on('end', finishedCallback);
    }).then(function() {
      // Absorb previous return and return nothing instead
    }).fin(function() {
      if (clientDone) {
        clientDone();
      }
    }).done;
  };

  // Returns the total number of Leagues that exist for a particular user
  self.getNumberOfUsersLeagues = function(username) {
    var clientDone;

    return Q.ninvoke(pg, 'connect', self.config.connectionUrl).then(function(values) {
      var client = values[0];
      clientDone = values[1];

      return client;
    }).then(function(client) {
      var queryParams = {
        name: 'get_users_leagues_count',
        text: 'SELECT COUNT(*) FROM leagues WHERE owner = $1;',
        values: [username]
      };

      return Q.ninvoke(client, 'query', queryParams);
    }).then(function(result) {
      if (result.rows.length !== 1) {
        throw new Error('Unexpected SQL result.');
      }

      return parseInt(result.rows[0].count);
    }).fin(function() {
      if (clientDone) {
        clientDone();
      }
    });
  };

  // Returns an array of league objects associated with the username. Returns an empty
  // array if the user does not exist or if the user has no leagues. League objects
  // contain the fields: id, name, owner, data, matches_tracked, and creation_time
  self.getUsersLeagues = function(username) {
    var clientDone;

    return Q.ninvoke(pg, 'connect', self.config.connectionUrl).then(function(values) {
      var client = values[0];
      clientDone = values[1];

      return client;
    }).then(function(client) {
      var queryParams = {
        name: 'get_users_leagues',
        text: 'SELECT id, name, owner, region, data, creation_time, matches_tracked FROM leagues WHERE owner = $1;',
        values: [username]
      };

      return Q.ninvoke(client, 'query', queryParams);
    }).then(function(result) {
      var leagues = result.rows;
      for (var i = 0; i < leagues.length; i++) {
        leagues[i].data = JSON.parse(leagues[i].data);
      }

      return leagues;
    }).fin(function() {
      if (clientDone) {
        clientDone();
      }
    });
  };

  // Returns false if a League with the given ID does not exist otherwise it returns an
  // object with the fields: id, name, owner, data, creation_time, and matches_tracked
  self.getLeague = function(id) {
    var clientDone;

    return Q.ninvoke(pg, 'connect', self.config.connectionUrl).then(function(values) {
      var client = values[0];
      clientDone = values[1];

      return client;
    }).then(function(client) {
      var queryParams = {
        name: 'get_league',
        text: 'SELECT id, name, owner, region, data, creation_time, matches_tracked FROM leagues WHERE id = $1;',
        values: [id]
      };

      return Q.ninvoke(client, 'query', queryParams);
    }).then(function(result) {
      if (!result.rows.length) {
        return false;
      } else {
        var league = result.rows[0];
        league.data = JSON.parse(league.data);

        return league;
      }
    }).fin(function() {
      if (clientDone) {
        clientDone();
      }
    });
  };

  // Update League with passed in id to have the passed in data and trackedMatches. The values
  // given overwrite any previous values. Data should be passed in as an object and trackedMatches
  // should be passed in as an array of gameIds. Returns nothing
  self.updateLeague = function(id, data, trackedMatches) {
    var clientDone;

    return Q.ninvoke(pg, 'connect', self.config.connectionUrl).then(function(values) {
      var client = values[0];
      clientDone = values[1];

      return client;
    }).then(function(client) {
      var queryParams = {
        name: 'update_league',
        text: 'UPDATE leagues SET data = $2, matches_tracked = $3 WHERE id = $1;',
        values: [id, JSON.stringify(data), trackedMatches]
      };

      return Q.ninvoke(client, 'query', queryParams);
    }).then(function() {
      // Absorb previous return and return nothing instead
    }).fin(function() {
      if (clientDone) {
        clientDone();
      }
    });
  };

  // Delete the League with the given id and returns nothing
  self.deleteLeague = function(id) {
    var clientDone;

    return Q.ninvoke(pg, 'connect', self.config.connectionUrl).then(function(values) {
      var client = values[0];
      clientDone = values[1];

      return client;
    }).then(function(client) {
      var queryParams = {
        name: 'delete_league',
        text: 'DELETE FROM leagues WHERE id = $1',
        values: [id]
      };

      return Q.ninvoke(client, 'query', queryParams);
    }).then(function() {
      // Absorb previous return and return nothing instead
    }).fin(function() {
      if (clientDone) {
        clientDone();
      }
    });
  };
}

module.exports = DB;
