import leagueoflegends as leagueapi
import time
import database as db
import traceback


lol = leagueapi.LeagueOfLegends("7c01554d-8bb6-4bcf-9857-386c552a74fa")


def evaluate_points(stats):
  total = 0

  total += stats["championsKilled"]               * 2
  total += stats["numDeaths"]                     * -2
  total += stats["assists"]                       * 1.5
  total += stats["minionsKilled"]                 * 0.01
  total += stats["doubleKills"]                   * 1
  total += stats["tripleKills"]                   * 2
  total += stats["qudraKills"]                    * 5
  total += stats["pentaKills"]                    * 12
  total += stats["goldEarned"]                    * 0
  total += stats["totalDamageDealtToChampions"]   * 0
  total += stats["totalHeal"]                     * 0
  total += stats["level"]                         * 0
  total += stats["turretsKilled"]                 * 3
  total += stats["wardKilled"]                    * 0
  total += stats["wardPlaced"]                    * 0
  total += stats["win"]                           * 0
  total += stats["totalGames"]                    * 0

  return total


def get_common_games_in_history(summoner_ids):

  if len(summoner_ids) < 1:
    raise InputError

  first_games = lol.get_summoner_games(next(iter(summoner_ids)))
  common_games = []
  for game in first_games:
    common = 0
    for player in game["fellowPlayers"]:
      if player["summonerId"] in summoner_ids:
        common += 1

    if common == len(summoner_ids) - 1:
      common_games.append(game["gameId"])

  return common_games


def get_stats_of_games(summoner_ids_names, match_ids, excluded_game_ids, min_start_time):

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
    player_stats[player]["win"] = 0
    player_stats[player]["totalGames"] = 0

  for player in summoner_ids_names:
    lastTenGames = lol.get_summoner_games(summoner_ids_names[player])
    for game in lastTenGames:
      game_id = game["gameId"]
      if game_id in match_ids and game_id not in excluded_game_ids:
        if "createDate" not in game or game["createDate"] / 1000 >= min_start_time:
          stats = game["stats"]

          player_stats[player]["championsKilled"] += stats.get("championsKilled", 0)
          player_stats[player]["numDeaths"] += stats.get("numDeaths", 0)
          player_stats[player]["assists"] += stats.get("assists", 0)
          player_stats[player]["minionsKilled"] += stats.get("minionsKilled", 0)
          player_stats[player]["doubleKills"] += stats.get("doubleKills", 0)
          player_stats[player]["tripleKills"] += stats.get("tripleKills", 0)
          player_stats[player]["qudraKills"] += stats.get("qudraKills", 0)
          player_stats[player]["pentaKills"] += stats.get("pentaKills", 0)
          player_stats[player]["goldEarned"] = stats.get("goldEarned", 0)
          player_stats[player]["totalDamageDealtToChampions"] += stats.get("totalDamageDealtToChampions", 0)
          player_stats[player]["totalHeal"] += stats.get("totalHeal", 0)
          player_stats[player]["level"] += stats.get("level", 0)
          player_stats[player]["turretsKilled"] += stats.get("turretsKilled", 0)
          player_stats[player]["wardKilled"] += stats.get("wardKilled", 0)
          player_stats[player]["wardPlaced"] += stats.get("wardPlaced", 0)
          player_stats[player]["win"] += stats.get("win", False)
          player_stats[player]["totalGames"] += 1

  return player_stats


def update_stats(group_id=None):
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

    common_matches = get_common_games_in_history(ids)
    stats = get_stats_of_games(name_ids, common_matches, already_tracked_games, create_time)
    for player in stats:
      for stat in stats[player]:
        group_stats[player]["stats"][stat] += stats[player][stat]
    db.update_group_data(group_id, group_stats)
    db.add_tracked_matches(group_id, common_matches)

  return


def auto_refresh_stats():
  while True:
    try:
      update_stats()
      print("Updated stats on:  " + time.asctime(time.gmtime()))
    except Exception as e:
      # print(e)
      print(traceback.format_exc())

    time.sleep(30)

  return


if __name__ == "__main__":
  auto_refresh_stats()
