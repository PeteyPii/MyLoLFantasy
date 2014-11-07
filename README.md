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

Finally, go up a directory and run:

```
python server.py
```

Your server should be online and you should be able to view it at localhost:5000!
