import sqlite3 as lite
import sys
import os
import json


def create_fresh_db():
  with open("myLoLFantasy.db", "w") as db:

    #Create the tables we want
    try:
      con = lite.connect("myLoLFantasy.db")
      cur = con.cursor()

      # The games_tracked text fields is space separated
      # The groups_in text fields is space separated
      # Stats is in the form of a JSON string
      # All others are just normal strings

      cur.executescript("""
        CREATE TABLE T_ADMIN(Account TEXT, LoL_account TEXT, PasswordHashes TEXT, GroupsIn TEXT);
        CREATE TABLE T_DATA(Group_ID INT, Creator TEXT, CreationTime TEXT, Stats TEXT, MatchesTracked TEXT, Name TEXT);""")

      con.commit()

    except lite.Error as e:
      os.remove("myLoLFantasy.db")
      print("ERROR creating database: " + e.args[0])

    finally:
      if con:
        con.close()

  return


def initialize_database():
  create_fresh_db()
  with open("dbState.json", "w") as fw:
    db_state = {"group_id": 100}
    json.dump(db_state, fw)

  return


if __name__ == "__main__":
  os.chdir("..")
  initialize_database()

