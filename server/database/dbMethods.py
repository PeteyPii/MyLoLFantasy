# Database methods for working with the DB

import sqlite3 as lite
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
    retList = set([])
    s = data[0][0]
    if s:
      s = s.split(",")
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


def get_group_name(group_id):
  con = lite.connect("myLoLFantasy.db")

  with con:
    cur = con.cursor()
    cur.execute("SELECT Name FROM T_DATA WHERE Group_ID= ? ", (str(group_id),))
    data = cur.fetchone()

    return data[0]


def update_group_data(group_id, data):

  con = lite.connect("myLoLFantasy.db")

  with con:
    cur = con.cursor()
    cur.execute("UPDATE T_DATA SET Stats = ? WHERE Group_ID = ?", (json.dumps(data), str(group_id)))


def add_tracked_matches(group_id, data):
  con = lite.connect("myLoLFantasy.db")

  updateString = ""

  existing_matches = get_tracked_match_ids(group_id)

  with con:
    cur = con.cursor()

    for match in data:
      existing_matches.add(match)

    for match in existing_matches:
      updateString = updateString + str(match) + ","

    updateString = updateString[0:-1]  #remove comma at the end

    cur.execute("UPDATE T_DATA SET matches_tracked = ? WHERE Group_ID = ?", (str(updateString), str(group_id)))


def user_exists(account):
  con = lite.connect("myLoLFantasy.db")

  with con:
    cur = con.cursor()

    cur.execute("SELECT 1 FROM T_ADMIN WHERE Account = ?", (account,))

    existCheck = cur.fetchone()
    if existCheck:
      return True
    else:
      return False


def create_user(account, password, lol_account):
  con = lite.connect("myLoLFantasy.db")

  with con:
    cur = con.cursor()

    """cur.execute("SELECT 1 FROM T_ADMIN WHERE Account = ?", (account,))

    existCheck = cur.fetchone()
    if existCheck:
      raise Exception('User already exists in the database!')
    else:
      cur.execute("INSERT INTO T_ADMIN VALUES(?, ?, ?, ?)", (account, lol_account, password, ""))"""

    cur.execute("INSERT INTO T_ADMIN VALUES(?, ?, ?, ?)", (account, lol_account, password, ""))

    con.commit()


"""def try_login(account, password):
  con = lite.connect("myLoLFantasy.db")

  with con:
    cur = con.cursor()

    cur.execute("SELECT password FROM T_ADMIN WHERE Account = ?", (account,))
    result = cur.fetchone()
    if result:
      return password == result[0]
    else:
      return False"""


def get_password(account):
  con = lite.connect("myLoLFantasy.db")

  with con:
    cur = con.cursor()

    cur.execute("SELECT password FROM T_ADMIN WHERE Account = ?", (account,))
    result = cur.fetchone()[0]
    return result


def get_lol_account(account):
  con = lite.connect("myLoLFantasy.db")

  with con:
    cur = con.cursor()

    cur.execute("SELECT LoL_account FROM T_ADMIN WHERE Account = ?", (account,))
    result = cur.fetchone()[0]
    return result


def get_groups_in(account):
  con = lite.connect("myLoLFantasy.db")

  with con:
    cur = con.cursor()

    cur.execute("SELECT groups_in FROM T_ADMIN WHERE Account = ?", (account,))
    groups = set([])
    s = cur.fetchone()[0]
    if s:
      group_list = s.split(" ")
      for group in group_list:
        groups.add(int(group))

    return groups


def create_group(account, name, summoners, summoner_ids):
  con = lite.connect("myLoLFantasy.db")

  with con:
    cur = con.cursor()

    db_state = {"group_id": 100}

    try:
      with open("dbState.json", "r") as fr:
        db_state = json.load(fr)
    except IOError as e:
      pass

    stats = {}
    i = 0
    for summoner in summoners:
      stats[summoner] = {}

      stats[summoner]["summonerId"] = summoner_ids[i]
      stats[summoner]["stats"] = {}

      stats[summoner]["stats"]["championsKilled"] = 0
      stats[summoner]["stats"]["numDeaths"] = 0
      stats[summoner]["stats"]["assists"] = 0
      stats[summoner]["stats"]["minionsKilled"] = 0
      stats[summoner]["stats"]["doubleKills"] = 0
      stats[summoner]["stats"]["tripleKills"] = 0
      stats[summoner]["stats"]["qudraKills"] = 0
      stats[summoner]["stats"]["pentaKills"] = 0
      stats[summoner]["stats"]["totalGames"] = 0
      i = i + 1

    cur.execute("INSERT INTO T_DATA VALUES(?, ?, ?, ?)", (str(db_state["group_id"]), json.dumps(stats), "", name))
    current_groups = get_groups_in(account)
    groups_text = str(db_state["group_id"]) + " "
    for group in current_groups:
      groups_text += str(group) + " "
    groups_text = groups_text.strip()
    cur.execute("UPDATE T_ADMIN SET groups_in = ? WHERE Account = ?", (groups_text, account))

    db_state["group_id"] += 1
    with open("dbState.json", "w") as fw:
      json.dump(db_state, fw)

    con.commit()
