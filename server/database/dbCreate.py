import sqlite3 as lite
import sys
import os
import json


def createFreshExampleDB():
  with open("myLoLFantasy.db", "w") as db:

    #Create the tables we want
    try:
      con = lite.connect("myLoLFantasy.db")
      cur = con.cursor()

      # The games_tracked text fields is CSV format
      # The groups_in text fields is space separated
      # Stats is in the form of a JSON string
      # All others are just normal strings

      cur.executescript("""
        CREATE TABLE T_ADMIN(Account TEXT, LoL_account TEXT, password TEXT, groups_in TEXT);
        INSERT INTO T_ADMIN VALUES("test", "Wonkeee", "password", "");
        CREATE TABLE T_DATA(Group_ID INT, Stats TEXT, matches_tracked TEXT, Name TEXT);""")
        # INSERT INTO T_DATA VALUES(99, '{"Patrick":{"summonerId":22333494,"stats":{"tripleKills":0,"numDeaths":15,"totalGames":2,
        #     "qudraKills":0,"championsKilled":11,"minionsKilled":26,"pentaKills":0,"assists":44,
        #     "doubleKills":2}},"PulseFire Annie":{"summonerId":35379243,"stats":{"tripleKills":2,
        #      "numDeaths":53,"totalGames":7,"qudraKills":0,"championsKilled":53,"minionsKilled":937,
        #     "pentaKills":0,"assists":81,"doubleKills":8}}}', "12345, 12321", "BEST_NAME");
        # """)

      con.commit()

    except lite.Error as e:
      os.remove("myLoLFantasy.db")
      print("ERROR creating database: %s" % e.args[0])
      sys.exit()

    finally:
      if con:
        con.close()


if __name__ == "__main__":
  os.chdir("..")
  createFreshExampleDB()
  with open("dbState.json", "w") as fw:
    dbState = {"group_id": 100}
    json.dump(dbState, fw)
