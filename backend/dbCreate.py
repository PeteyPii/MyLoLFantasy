#!/usr/bin/python3
# -*- coding: utf-8 -*-

#Run this script in a directory to create a local SQLite DB that has the data we want in it.


import sqlite3 as lite
import sys
import os

#Check to see if the DB (with the same name) exists.
if os.path.exists("myLoLFantasy.db"):
    print("ERROR: file with name 'myLoLFantasy.db' already exists in current directory.")
    sys.exit(1)

#If file doesn't exist, create it
with open("myLoLFantasy.db", "w") as db:

    #Create the tables we want
    try:
        con = lite.connect("myLoLFantasy.db")
        cur = con.cursor()

        # The groups_in and games_tracked text fields are CSV format
        # Stats is in the form of a JSON string
        # All others are just normal strings

        cur.executescript("""
            CREATE TABLE T_ADMIN(Account TEXT, LoL_account TEXT, password TEXT, groups_in TEXT);
            CREATE TABLE T_DATA(Group_ID INT, Stats TEXT, matches_tracked TEXT);
            INSERT INTO T_DATA VALUES(333, '{"Patrick":{"summonerId":22333494,"stats":{"tripleKills":0,"numDeaths":15,"totalGames":2,
                "qudraKills":0,"championsKilled":11,"minionsKilled":26,"pentaKills":0,"assists":44,
                "doubleKills":2}},"PulseFire Annie":{"summonerId":35379243,"stats":{"tripleKills":2,
                 "numDeaths":53,"totalGames":7,"qudraKills":0,"championsKilled":53,"minionsKilled":937,
                "pentaKills":0,"assists":81,"doubleKills":8}}}', "12345, 12321");
            """)

        con.commit()

    except lite.Error as e:
        os.remove("myLoLFantasy.db")
        print("ERROR creating database: %s" % e.args[0])
        sys.exit()

    finally:
        if con:
            con.close()
