#import database as db

class User():

  def __init__(self, username, password, summonerName):
    self.username = username
    self.password = password
    self.summonerName = summonerName
  def getUser(self, username):
    #self.oneUser = db.get_User(username)
    #self.username = oneUser['username']
    #self.password = oneUser['password']
    #self.summonerName = oneUser['summonerName']
    return self
  def is_authenticated(self):
    return True
  def is_active(self):
    return True
  def is_anonymous(self):
    return False
  def get_id(self):
    return self.id
