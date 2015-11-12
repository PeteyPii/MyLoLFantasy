My LoL Fantasy
==============
Play fantasy League of Legends with your friends by earning your team's points yourself. Play League of Legends games with friends to compete and see who is the best!

Technologies
------------
- Node.js
- Express
- Redis
- PostgreSQL
- League of Legends API
- Less
- Twitter Bootstrap
- Font Awesome

Getting up and running
----------------------
First install the following:
- Node.js (v0.12.0)
- PostgreSQL (v9.4.1)
- Redis (v2.8.19)
- Python (v2.7.9)
- The correct build system for C++, for [node-gyp](https://github.com/TooTallNate/node-gyp) (e.g. VS Express 2013 for Desktop on Windows)

Other versions may be okay, but these are the ones we use and test with.

Next, `git clone` the repo. In the root directory do `npm install` and make sure all the dependencies are fetched and built correctly. At this point
you'll want to make sure that you've set up a working PostgreSQL service and a local Redis service on port 6379. Now, you need to set up a `settings.json`
with the following:

```
{
  "lol_api_key": "XXXXXXXX-XXXX-XXXX-XXXX-XXXXXXXXXXXX",
  "postgre_url": "postgres://user:password@hostname/database",
  "secret_key": "keyboard cat"
}
```

Where:
- `lol_api_key` is your API key from Riot games
- `postgre_url` is a URL to your PostgreSQL database dedicated to MLF
- `secret_key` is used for cookies, use some random string here

Finally, as long as you've done everything correctly so far, you should be able to run `node create_db.js` to initialize database tables. Now, install
some tools, `npm install -g grunt-cli supervisor`, and then run `grunt open` and you should see the app in your browser shortly. If not, try manually
checking out `https:\\localhost`.

Contributing
------------
Fork the repo, make sure that you have the latest changes, then branch off the `development` branch. Make your changes. Send a pull request
into the original repo's `development` branch and wait for us to review it and hopefully accept it.

Things we like to see are:
- Commit messages in the past tense (e.g. "Fixed problem x" or "Implemented feature y").
- Branch name in snake case.
- If you're working on a relevant issue from GitHub, precede commit messages and branch names with the issue number (e.g. I25_branch_name or "I25: Commit message").
- Follow the coding styles we already use.

Special mentions
----------------
We would like to thank the following people for their work on My LoL Fantasy:
- Patrick Wrobel
- Balaji Sankaranarayanan
- Josh Kergan
- Patrick Perrier
