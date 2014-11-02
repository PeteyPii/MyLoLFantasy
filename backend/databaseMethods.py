#Database methods for working with the DB

import sqlite3 as lite
import sys
import json


def get_all_groups():
  con = lite.connect("myLoLFantasy.db")

  with con:
    cur = con.cursor()
    cur.execute("SELECT Group_ID FROM T_DATA")
    data = cur.fetchall()
    retList = []
    for item in data:
      retList.append(item[0])


    return retList

def get_tracked_match_ids(group_id):
  con = lite.connect("myLoLFantasy.db")

  with con:
    cur = con.cursor()
    cur.execute("SELECT matches_tracked FROM T_DATA WHERE Group_ID= ? ", (str(group_id),))
    data = cur.fetchall()
    s = data[0][0]
    s = s.split(",")
    retList = set([])
    for num in s:
      num = num.strip()
      retList.add(int(num))

    return retList

def get_group_data(group_id):
  con = lite.connect("myLoLFantasy.db")

  with con:
    cur = con.cursor()
    cur.execute("SELECT Stats FROM T_DATA WHERE Group_ID= ? ", (str(group_id),))
    data = cur.fetchall()

    data = json.loads(data[0][0])

    return data

def update_group_data(group_id, data):

  con = lite.connect("myLoLFantasy.db")

  with con:
    cur = con.cursor()
    cur.execute("UPDATE T_DATA SET Stats = ? WHERE Group_ID = ?", (json.dumps(data), str(group_id)))


def add_tracked_matches(group_id, data):
  con = lite.connect("myLoLFantasy.db")

  updateString = ""

  x = get_tracked_match_ids(group_id)

  with con:
    cur = con.cursor()

    for i in data:
      x.add(i)

    for i in x:
      updateString = updateString + str(i) + ","

    updateString = updateString[0:-1]  #remove comma at the end

    cur.execute("UPDATE T_DATA SET matches_tracked = ? WHERE Group_ID = ?", (str(updateString), str(group_id)))


def create_user(data):
  #Data is a 3-tuple: account, password, lol_account

  try: 
    con = lite.connect("myLoLFantasy.db")
    cur = con.cursor()   

    cur.execute("SELECT 1 FROM T_ADMIN WHERE Account = ?", (data[0],))

    existCheck = cur.fetchone()
    if existCheck:
      raise Exception('User already exists in the database!') 
    else:
      print("haha")
      cur.execute("INSERT INTO T_ADMIN VALUES(?, ?, ?, ?)", (data[0], data[2], data[1], ""))

    con.commit()
    
  except lite.Error as e:
    con.rollback()
    raise

  except Exception as e:
    raise  #will have done nothing, but throw it up a level

  else:
    return True   #everything went ok
  finally: 
    if con:
      con.close()
