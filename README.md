My LoL Fantasy
==============
Play fantasy League of Legends with your friends by earning your team's points yourself. Play League of Legends games with friends to compete and see who is the best!

Technologies
------------
- Node.js
- Express
- Angular
- Redis
- PostgreSQL
- League of Legends API
- Less

Getting up and running
----------------------
First install the following:
- Node.js (v6.3.0)
- PostgreSQL (v9.4.1)
- Redis (v3.0.500)
- Python (v2.7.11)
- The correct build system for C++, for [node-gyp](https://github.com/TooTallNate/node-gyp) (e.g. VS Community 2015 on Windows)

Other versions may be okay, but these are the ones we use and test with.

Next, `git clone` the repo. In the root directory do `npm install` and make sure all the dependencies are fetched and built correctly. At this point
you'll want to make sure that you've set up a working PostgreSQL service and a local Redis service. Now, you need to set up a `settings.json`
with the following:

```
{
  "lol_api_key": "XXXXXXXX-XXXX-XXXX-XXXX-XXXXXXXXXXXX",
  "postgre_url": "postgres://user:password@hostname/database",
  "email_url": "smtps://user%40example.com:password@smtp.example.com",
  "secret_key": "keyboard cat"
}
```

Where:
- `lol_api_key` is your API key from Riot games
- `postgre_url` is a URL to your PostgreSQL database dedicated to MyLF
- `email_url` is a connection URL for sending emails (used for resetting passwords, can be set to a dummy value while developing)
- `secret_key` is used for cookies, use some cryptographically random string here

Finally, as long as you've done everything correctly so far, you should be able to run `node batch/create_db.js` to initialize database tables (CAUTION:
this wipes any exisitng tables for MyLF; don't perform this  step if your DB is already set up). Now, install gulp, `npm install -g gulp-cli`, and then
run `gulp bower` to install front-end dependencies. Finally, you can run `gulp` to build the Less and Jade files and start the webserver. Once it is running
you should be able to view the app in your browser at [localhost](http://localhost/).

Contributing
------------
Fork the repo, make sure that you have the latest changes, then branch off the `development` branch. Make your changes. Send a pull request
into the original repo's `development` branch and wait for us to review it and hopefully accept it. All that we ask is that you try to follow
the exisitng coding styles that we use.

Special mentions
----------------
We would like to thank the following people for their work on My LoL Fantasy:
- Patrick Wrobel ([@PeteyPii](https://github.com/PeteyPii))
- Balaji Sankaranarayanan ([@bsankara](https://github.com/bsankara))
- Josh Kergan ([@joshkergan](https://github.com/joshkergan))
- Patrick Perrier ([@pperrier27](https://github.com/pperrier27))
