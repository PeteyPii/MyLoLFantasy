import json

if __name__ == "__main__":
  patrickId = 22333494  # have this by magic
  balajiId = 35379243
  with open("test.json") as inFile:
    recentGames = json.load(inFile)["games"]
    for gameIndex in range(len(recentGames)):
      for player in range(9):
        if recentGames[gameIndex]["fellowPlayers"][player]["summonerId"] == patrickId:
          print("patty was in this game")
          break

      print()
