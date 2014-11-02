import leagueoflegends as leagueapi


lol = leagueapi.LeagueOfLegends("a11424c1-eb9b-470c-8405-d52ef58c5a67")


def get_common_games_in_history(summoner_ids):

  if len(summoner_ids) < 2:
    return

  print(balajiId)
  print(patrickId)

  first = lol.get_summoner_games(next(iter(summoner_ids)))
  commonGames = []
  for game in first:
    common = 0
    for player in game["fellowPlayers"]:
      if player["summonerId"] in summoner_ids:
        common += 1

    if common == len(summoner_ids) - 1:
      commonGames.append(game)

  return commonGames


if __name__ == "__main__":
  print("Running the things")

  balajiId = lol.get_summoner_id_from_name("PulseFire Annie")
  patrickId = lol.get_summoner_id_from_name("BasicBananas")

  print(get_common_games_in_history([balajiId, patrickId]))
