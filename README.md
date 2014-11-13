My LoL Fantasy
==============

Play fantasy League of Legends with your friends by earning points yourself. Play games with friends and earn points and compete.


Tools
-----

Backend:
- Flask
- SQLite
- passlib
- League of Legends API

Frontend:
- Twitter Bootstrap
- Font Awesome


Getting Up and Running
----------------------

Prerequisite: Make sure you are running Python 3. We use Python 3.4 but it should work on other Python 3 versions as well.

First install some dependencies:

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

Next, clone the repository, go to the server/database directory and run:

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

Your server should now be online and you should be able to view it at localhost:5000!
