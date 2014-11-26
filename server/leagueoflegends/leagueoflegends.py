import urllib.request
import urllib.error
import json
import time
import threading


class LeagueOfLegends:

  api_base_url = 'https://na.api.pvp.net/api/lol'
  api_version = '1.4'
  api_region = 'na'
  api_url = api_base_url + '/' + api_region + '/' + 'v' + api_version + '/'
  max_calls_per_ten_seconds = 8
  short_cache = {}
  long_cache = {}
  mutex = threading.Lock()

  def __init__(self, api_key):
    self.api_key = api_key
    self.request_times = []
    for i in range(self.max_calls_per_ten_seconds):
      self.request_times.append(0)

  # 1 == short cache
  # 2 == long cache
  def __webrequest(self, url, cache=None):
    try:
      if url in self.short_cache:
        return self.short_cache[url]
      elif url in self.long_cache:
        return self.long_cache[url]
      else:
        with self.mutex:
          # If we've made too calls in the last 10 seconds wait until we can make another request
          now = time.time()
          if now - self.request_times[0] < 10:
            time.sleep(min(10 - (now - self.request_times[0]), 10)) # limit waiting to 10 seconds in case system clock changes

          for i in range(self.max_calls_per_ten_seconds - 1):
            self.request_times[i] = self.request_times[i + 1]

          self.request_times[-1] = time.time()

          opener = urllib.request.build_opener(NotModifiedHandler())
          req = urllib.request.Request(url)

          url_handle = opener.open(req)

          response = url_handle.read()

          if response is not None:
            if cache == 1: # short cache
              self.short_cache[url] = response
            elif cache == 2: # long cache
              self.long_cache[url] = response

            return response

    except urllib.error.HTTPError as e:
      # You should surround your code with try/catch that looks for a HTTPError
      # code 429 -- this is a rate limit error from Riot.
      raise RiotError(e.code)

  def update_api_url(self):
    self.api_url = self.api_base_url + '/' + self.api_region + '/' + 'v' + self.api_version + '/'

  def set_api_region(self, region):
    if region is not None:
      if region.lower() in ['na', 'euw', 'eune', 'br', 'tr']:
        self.api_region = region.lower()
        self.update_api_url()

  def set_api_version(self, version):
    if version is not None:
      self.api_version = version
      self.update_api_url()

  def get_summoner_by_name(self, summoner_name):
    if summoner_name is not None:
      self.set_api_version('1.4')
      url = self.api_url + 'summoner/by-name/{}?api_key={}'.format(summoner_name.replace(' ', '%20'), self.api_key)
      response = json.loads(self.__webrequest(url, 2).decode())
      return response

  def get_summoner_id_from_name(self, summoner_name):
    if summoner_name is not None:
      return self.get_summoner_by_name(summoner_name)[summoner_name.lower().replace(' ', '')]['id']

  def get_summoner_games(self, summoner_id):
    if summoner_id is not None:
      self.set_api_version('1.3')
      url = self.api_url + 'game/by-summoner/{}/recent?api_key={}'.format(summoner_id, self.api_key)
      response = json.loads(self.__webrequest(url, 1).decode())
      return response['games']

  def reset_short_cache(self):
    self.short_cache = {}

  def reset_long_cache(self):
    self.long_cache = {}


class RiotError(Exception):

  def __init__(self, code):
    self.code = code
    if code == 429:
      self.error_msg = 'Rate limit exceeded'
    else:
      self.error_msg = 'Error {} from Riot servers'.format(code)

  def __str__(self):
    return repr(self.error_msg)


class NotModifiedHandler(urllib.request.BaseHandler):

  def http_error_304(self, req, fp, code, message, headers):
    addinfourl = urllib.request.addinfourl(fp, headers, req.get_full_url())
    addinfourl.code = code
    return addinfourl
