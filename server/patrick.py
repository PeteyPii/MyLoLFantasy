# Just a file that I use to test small things or automate things I repeat a lot

import database as db
import os
import getpass
import json
import leagueoflegends as leagueapi
import time

os.environ["PASSLIB_BUILTIN_BCRYPT"] = "enabled"
from passlib.hash import bcrypt_sha256


lol_api = None


def create_patricks_login():
  password = getpass.getpass()
  confirm_password = getpass.getpass("Confirm password: ")
  if password == confirm_password:
    username = "BasicBananas"
    summoner_name = "BasicBananas"
    password_hash = bcrypt_sha256.encrypt(password, rounds=6)
    db.create_user(username, password_hash, summoner_name)
  else:
    print("Passwords do not match, try again")

  return

def create_patricks_leagues():
  if os.path.isfile("settings.json"):
    with open("settings.json", "r") as fr:
      settings = json.load(fr)

      if ("balaji" not in settings or
          "alex" not in settings or
          "neil" not in settings or
          "simon" not in settings or
          "il hae" not in settings):
        print("Missing someone's summoner name in settings")
      else:
        balaji = settings["balaji"]
        neil = settings["neil"]
        alex = settings["alex"]
        simon = settings["simon"]
        il_hae = settings["il hae"]

        leagues = {}
        leagues["Solo"] = []
        leagues["Balaji"] = [balaji]
        leagues["Il Hae"] = [il_hae]
        leagues["The Trio"] = [balaji, il_hae]
        leagues["Add Alex"] = [balaji, il_hae, alex]
        leagues["Add Neil"] = [balaji, il_hae, neil]
        leagues["Add Simon"] = [balaji, il_hae, simon]
        leagues["Add Alex + Neil"] = [balaji, il_hae, alex, neil]
        leagues["Add Alex + Simon"] = [balaji, il_hae, alex, simon]
        leagues["Add Neil + Simon"] = [balaji, il_hae, neil, simon]
        leagues["3v3"] = [balaji, il_hae, alex, neil, simon]
        leagues["Balaji + Alex"] = [balaji, alex]
        leagues["Balaji + Simon"] = [balaji, simon]
        leagues["Balaji + Neil"] = [balaji, neil]
        leagues["Arch Nemeses"] = ["MrJuneJune", "Voyboyy"]

        for group_name in leagues:
          players = ["BasicBananas"]
          for player in leagues[group_name]:
            players.append(player)

          summoner_ids = []
          for player in players:
            summoner_ids.append(lol_api.get_summoner_id_from_name(player))

          db.create_group("BasicBananas", group_name, players, summoner_ids, int(time.time()))

  return


if __name__ == "__main__":
  valid_settings = False
  if os.path.isfile("settings.json"):
    with open("settings.json", "r") as fr:
      settings = json.load(fr)

      if "lol-api-key" not in settings or not settings["lol-api-key"]:
        print("LoL API key is not configured correctly. Set 'lol-api-key' to your key, including the dashes")
      else:
        valid_settings = True

  else:
    with open("settings.json", "w") as fw:
      settings = {}
      settings["lol-api-key"] = None
      json.dump(settings, fw)
      print("You need to configure the server before you can run it. See the file: 'settings.json'.")

  if valid_settings:
    lol_api = leagueapi.LeagueOfLegends(settings["lol-api-key"])

    db.initialize_database()
    create_patricks_login()
    create_patricks_leagues()
