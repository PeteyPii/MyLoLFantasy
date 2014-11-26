import leagueoflegends as leagueapi
import database as db
import time
import decimal
import traceback
import os
import json


def evaluate_points(stats):
  total = decimal.Decimal(0)

  total += stats["championsKilled"]               * decimal.Decimal("2")
  total += stats["numDeaths"]                     * decimal.Decimal("-2")
  total += stats["assists"]                       * decimal.Decimal("1.5")
  total += stats["minionsKilled"]                 * decimal.Decimal("0.01")
  total += stats["doubleKills"]                   * decimal.Decimal("1")
  total += stats["tripleKills"]                   * decimal.Decimal("2")
  total += stats["qudraKills"]                    * decimal.Decimal("5")
  total += stats["pentaKills"]                    * decimal.Decimal("12")
  total += stats["goldEarned"]                    * decimal.Decimal("0")
  total += stats["totalDamageDealtToChampions"]   * decimal.Decimal("0")
  total += stats["totalHeal"]                     * decimal.Decimal("0")
  total += stats["level"]                         * decimal.Decimal("0")
  total += stats["turretsKilled"]                 * decimal.Decimal("3")
  total += stats["wardKilled"]                    * decimal.Decimal("0")
  total += stats["wardPlaced"]                    * decimal.Decimal("0")
  total += stats["totalDamageTaken"]              * decimal.Decimal("0")
  total += stats["win"]                           * decimal.Decimal("0")
  total += stats["totalGames"]                    * decimal.Decimal("0")

  return total


def get_common_games_in_history(lol_api, summoner_ids):
  if len(summoner_ids) < 1:
    raise InputError

  first_games = lol_api.get_summoner_games(next(iter(summoner_ids)))
  common_games = []
  for game in first_games:
    common = 0

    # We have to check if there are any fellow players because of custom bot games
    if "fellowPlayers" in game:
      for player in game["fellowPlayers"]:
        if player["summonerId"] in summoner_ids:
          common += 1

    if common == len(summoner_ids) - 1:
      common_games.append(game["gameId"])

  return common_games


def get_stats_of_games(lol_api, summoner_ids_names, match_ids, excluded_game_ids, min_start_time):
  player_stats = {}
  for player in summoner_ids_names:
    player_stats[player] = {}

    player_stats[player]["championsKilled"] = 0
    player_stats[player]["numDeaths"] = 0
    player_stats[player]["assists"] = 0
    player_stats[player]["minionsKilled"] = 0
    player_stats[player]["doubleKills"] = 0
    player_stats[player]["tripleKills"] = 0
    player_stats[player]["qudraKills"] = 0
    player_stats[player]["pentaKills"] = 0
    player_stats[player]["goldEarned"] = 0
    player_stats[player]["totalDamageDealtToChampions"] = 0
    player_stats[player]["totalHeal"] = 0
    player_stats[player]["level"] = 0
    player_stats[player]["turretsKilled"] = 0
    player_stats[player]["wardKilled"] = 0
    player_stats[player]["wardPlaced"] = 0
    player_stats[player]["totalDamageTaken"] = 0
    player_stats[player]["win"] = 0
    player_stats[player]["totalGames"] = 0

  for player in summoner_ids_names:
    lastTenGames = lol_api.get_summoner_games(summoner_ids_names[player])
    for game in lastTenGames:
      game_id = game["gameId"]
      if game_id in match_ids and game_id not in excluded_game_ids:
        if "createDate" not in game or game["createDate"] / 1000 >= min_start_time:
          stats = game["stats"]

          player_stats[player]["championsKilled"] += stats.get("championsKilled", 0)
          player_stats[player]["numDeaths"] += stats.get("numDeaths", 0)
          player_stats[player]["assists"] += stats.get("assists", 0)
          player_stats[player]["minionsKilled"] += stats.get("minionsKilled", 0) + stats.get("neutralMinionsKilled", 0)
          player_stats[player]["doubleKills"] += stats.get("doubleKills", 0)
          player_stats[player]["tripleKills"] += stats.get("tripleKills", 0)
          player_stats[player]["qudraKills"] += stats.get("qudraKills", 0)
          player_stats[player]["pentaKills"] += stats.get("pentaKills", 0)
          player_stats[player]["goldEarned"] += stats.get("goldEarned", 0)
          player_stats[player]["totalDamageDealtToChampions"] += stats.get("totalDamageDealtToChampions", 0)
          player_stats[player]["totalHeal"] += stats.get("totalHeal", 0)
          player_stats[player]["level"] += stats.get("level", 0)
          player_stats[player]["turretsKilled"] += stats.get("turretsKilled", 0)
          player_stats[player]["wardKilled"] += stats.get("wardKilled", 0)
          player_stats[player]["wardPlaced"] += stats.get("wardPlaced", 0)
          player_stats[player]["totalDamageTaken"] += stats.get("totalDamageTaken", 0)
          player_stats[player]["win"] += stats.get("win", False)
          player_stats[player]["totalGames"] += 1

  return player_stats


def update_stats(lol_api, group_id=None):
  if group_id == None:
    all_groups = db.get_all_groups()
  else:
    all_groups = [group_id]

  for group_id in all_groups:
    already_tracked_games = db.get_tracked_match_ids(group_id)
    group_stats = db.get_group_data(group_id)
    create_time = db.get_group_creation_time(group_id)
    name_ids = {}
    for player in group_stats:
      name_ids[player] = group_stats[player]["summonerId"]

    ids = set([])
    for player in name_ids:
      ids.add(name_ids[player])

    common_matches = get_common_games_in_history(lol_api, ids)
    stats = get_stats_of_games(lol_api, name_ids, common_matches, already_tracked_games, create_time)
    for player in stats:
      for stat in stats[player]:
        group_stats[player]["stats"][stat] += stats[player][stat]
    db.add_tracked_matches(group_id, common_matches)
    db.update_group_data(group_id, group_stats)

  return


def auto_refresh_stats(lol_api, period):
  while True:
    start_time = time.time()
    try:
      print("Updating stats. Avoid ending execution until stats are fully updated")
      update_stats(lol_api)
      print("Updated stats on: " + time.asctime(time.gmtime()))
    except Exception as e:
      print(traceback.format_exc()) # Let's get some information about this exception

    wait_time = period - (time.time() - start_time)

    if wait_time > 0:
      time.sleep(wait_time)

  return


if __name__ == "__main__":
  valid_settings = False
  if os.path.isfile("settings.json"):
    with open("settings.json", "r") as fr:
      settings = json.load(fr)

      if "lol-api-key" not in settings or not settings["lol-api-key"]:
        print("LoL API key is not configured correctly. Set 'lol-api-key' to your key, including the dashes")
      elif "refresh-period" not in settings:
        print("Stat refresh period is not configured correctly. Set 'refresh-period' to a period in seconds for how often to refresh statistics")
      else:
        good_refresh_period = False
        try:
          x = float(settings["refresh-period"])
          if x < 0:
            print("Refresh period should be non-negative")
          else:
            good_refresh_period = True
        except Exception as e:
          print("Refresh period is not a number")

        if good_refresh_period:
          valid_settings = True

  else:
    with open("settings.json", "w") as fw:
      settings = {}
      settings["lol-api-key"] = None
      settings["refresh-period"] = 3600
      json.dump(settings, fw)
      print("You need to configure the server before you can run it. See the file: 'settings.json'.")

  if valid_settings:
    lol_api = leagueapi.LeagueOfLegends(settings["lol-api-key"])
    try:
      auto_refresh_stats(lol_api, settings["refresh-period"])
    except KeyboardInterrupt:
      print("Stopping stat refresher")
