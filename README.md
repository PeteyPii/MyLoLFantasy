My LoL Fantasy
==============

Play fantasy League of Legends with your friends by earning points yourself. Play games with friends and earn points and compete.


Tools
-----

- Flask
- SQLite
- passlib
- League of Legends API
- Sass
- Twitter Bootstrap
- Font Awesome


Getting Up and Running
----------------------

Prerequisite: Make sure you are running Python 3. We use Python 3.4 but it should work on other Python 3 versions as well. You'll also need Sass (and by extension of this, Ruby).

To start, install some dependencies:

```
pip install Flask
pip install passlib
```

It is recommended you install one of the following if you can:

```
pip install bcrypt
pip install py-bcrypt
pip install bcryptor
```

Next, clone the repository, then go to the server/database directory and run:

```
python dbCreate.py
```

Now, go up a directory and run:

```
python server.py
```

This should create an empty settings file for you called 'settings.json'. In this file you need to configure a LoL API key to use which should be stored as a string. E.g. "lol-api-key" : "01234567-0123-0123-0123-0123456789ab". Then you also need to create a secret session key. You need a random 24 byte sequence which you can get by running this in a python shell:

```
import os
num = os.urandom(24)
key = []
for b in num:
  key.append(b)
print(key)
```

Put your secret key in settings.json like so: "session-key" : [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 0, 1, 2, 3].

We use Sass so you will need to compile the website's style sheets. From the current (server) directory you can run:

```
sass static/scss/theme.scss:static/css/theme.scss
```

for a one-time compile whenever you want or you can do:

```
sass --watch static/scss:static/css
```

for automatic recompiling whenever the Sass files change.

Once you run:

```
python server.py
```

Your server should be online and you should be able to view it at localhost:5000!


Contributing
------------

First make sure you are on the development branch:

```
git checkout development
```

Then create a branch to work on. Name it nicely with a description and issue number like so:

```
git branch features/I29_use_git_branches
git checkout features/I29_use_git_branches
```

If there's no issue number to go with your change or there are multiple, just include the description. If you're fixing a bug use the naming convention "fixes" instead of "features". Afterwards, change whatever you wanted to change and commit your work with a meaningful message (don't forget to double-check your work before doing so):

```
git status    # Make sure you are on the right branch
git diff      # and that your changes are okay
git add .
git commit -m "I29: Added git branches and described workflow in README"
git push
```

You should get an error about the upstream not being set, solve this by typing what git tells you to. If you know what you're doing feel free to do this in the previous step.

```
git push --set-upstream origin features/I29_use_git_branches
```

You can either continue working if you're not satisfied with your changes by making more commits and pushing them or you can ask for a pull request on GitHub. We'll review your changes there and then if we like them we'll merge your changes in and delete the branch you created.
