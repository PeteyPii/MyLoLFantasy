#!/usr/bin/python
# -*- coding: utf-8 -*-

"""
Python library for the League of Legends official API
Copyright (c) 2013 Jennie Lees <jennielees@gmail.com>

The LoL API belongs to Riot and can be found here:
https://developer.riotgames.com/

This product is not endorsed, certified or otherwis
approved in any way by Riot Games, Inc. or any of its affiliates.
"""

__author__ = 'Jennie Lees'
__version__ = '0.1'

import urllib.request
import urllib.error
import json
import unicodedata
import re
import time

class LeagueOfLegends:

    API_BASE_URL = 'https://na.api.pvp.net/api/lol'
    api_version = '1.4'
    api_region = 'na'
    api_url = API_BASE_URL + '/' + api_region + '/' + 'v' + api_version + '/'

    def __init__(self, api_key):
        self.api_key = api_key
        self.request_times = [0, 0, 0, 0]

    def __webrequest(self, url):
        # print('Making request to: ' + url)
        try:
            # if we've made four calls in the last 10 seconds wait until we can make another request
            now = time.time()
            if now - self.request_times[0] < 10:
                time.sleep(min(10 - (now - self.request_times[0]), 10)) # limit waiting to 10 seconds in case system clock changes

            self.request_times[0] = self.request_times[1]
            self.request_times[1] = self.request_times[2]
            self.request_times[2] = self.request_times[3]
            self.request_times[3] = time.time()

            opener = urllib.request.build_opener(NotModifiedHandler())
            req = urllib.request.Request(url)

            url_handle = opener.open(req)

            headers = url_handle.info()
            response = url_handle.read()

            return response

        except urllib.error.HTTPError as e:
            # You should surround your code with try/catch that looks for a HTTPError
            # code 429 -- this is a rate limit error from Riot.
            # print('HTTPError calling ' + url)
            raise RiotError(e.code)
            return None

    def set_api_region(self, region):
        if region is not None:
            if region.lower() in ['na', 'euw', 'eune', 'br', 'tr']:
                self.api_region = region.lower()
                self.update_api_url()
                return self.api_url
            else:
                return None

    def set_api_version(self, version):
        if version is not None:
            self.api_version = version
            self.update_api_url()
            return self.api_url

    def update_api_url(self):
        self.api_url = self.API_BASE_URL + '/' + self.api_region + '/' + 'v' + self.api_version + '/'
      #  print(self.api_url)

    def __getjsondata(self, namespace, query=''):

        query = query.replace(' ', '+')
        query = unicodedata.normalize('NFKD',
                                      query.decode('utf-8')) \
            .encode('ascii', 'ignore')
        url = self.api_url + namespace + query + '.js?api_key='\
            + self.api_key
        response = self.__webrequest(url)
        if response is not None:
            response = json.loads(response, strict=False)
        return response

    def get_data(self, namespace, query=''):
        result = self.__getjsondata(namespace, '/%s' % query)
        return result

    def get_champions(self, free_to_play=False):
        # Champion API is version 1.1 only
        self.set_api_version('1.1')
        url = self.api_url + 'champion?api_key=' + self.api_key + '&freeToPlay=' + str(free_to_play)
        response = json.loads(self.__webrequest(url))
        return response["champions"]

    def get_summoner_games(self, summoner_id=None):
        if summoner_id is None:
            if self.summoner_id is not None:
                summoner_id = self.summoner_id
            else:
                return
        self.set_api_version('1.3')
        url = self.api_url + 'game/by-summoner/%s/recent?api_key=%s' % (summoner_id, self.api_key)
        response = json.loads(self.__webrequest(url).decode())
        return response["games"]

    def get_summoner_leagues(self, summoner_id=None):
        if summoner_id is None:
            if self.summoner_id is not None:
                summoner_id = self.summoner_id
            else:
                return
        self.set_api_version('2.2')
        url = self.api_url + 'league/by-summoner/%s?api_key=%s' % (summoner_id, self.api_key)
        response = json.loads(self.__webrequest(url))
        # Return data with more useful keys based on league type
        remapped_league = {}
        for league in response:
            remapped_league[response[league]["queue"]] = response[league]
        return remapped_league

    def get_summoner_stats(self, summoner_id=None, season=None):
        if summoner_id is None:
            if self.summoner_id is not None:
                summoner_id = self.summoner_id
            else:
                return
        self.set_api_version('1.2')
        url = self.api_url + 'stats/by-summoner/%s/summary?api_key=%s' % (summoner_id, self.api_key)
        response = json.loads(self.__webrequest(url).decode())
        if response["summonerId"] != summoner_id:
            raise DataMismatchError
        return response["playerStatSummaries"]

    def get_summoner_ranked_stats(self, summoner_id=None, season=None):
        if summoner_id is None:
            if self.summoner_id is not None:
                summoner_id = self.summoner_id
            else:
                return
        self.set_api_version('1.2')
        url = self.api_url + 'stats/by-summoner/%s/ranked?api_key=%s' % (summoner_id, self.api_key)
        response = json.loads(self.__webrequest(url).decode())
        if response["summonerId"] != summoner_id:
            raise DataMismatchError
        # response["modifyDate"] is also returned, but assuming developers would be tracking
        # separately, though there could be some use-cases around delta stats.
        return response["champions"]

    def get_summoner_by_id(self, summoner_id=None):
        if summoner_id is None:
            if self.summoner_id is not None:
                summoner_id = self.summoner_id
            else:
                return
        self.set_api_version('1.2')
        url = self.api_url + 'summoner/%s?api_key=%s' % (summoner_id, self.api_key)
        response = json.loads(self.__webrequest(url).decode())
        return response

    def get_summoner_by_name(self, summoner_name):
        if summoner_name == '':
            return
        self.set_api_version('1.4')
        url = self.api_url + 'summoner/by-name/%s?api_key=%s' % (summoner_name.replace(' ', '%20'), self.api_key)
        response = json.loads(self.__webrequest(url).decode())
        return response

    def get_summoner_id_from_name(self, summoner_name):
        return self.get_summoner_by_name(summoner_name)[summoner_name.lower().replace(' ', '')]["id"]

    def get_summoner_name_from_id(self, summoner_id):
        return self.get_summoner_by_id(summoner_id)["name"]

    def get_summoner_masteries(self, summoner_id=None):
        if summoner_id is None:
            if self.summoner_id is not None:
                summoner_id = self.summoner_id
            else:
                return
        self.set_api_version('1.2')
        url = self.api_url + 'summoner/%s/masteries?api_key=%s' % (summoner_id, self.api_key)
        response = json.loads(self.__webrequest(url).decode())
        return response["pages"]

    def get_summoner_runes(self, summoner_id=None):
        if summoner_id is None:
            if self.summoner_id is not None:
                summoner_id = self.summoner_id
            else:
                return
        self.set_api_version('1.2')
        url = self.api_url + 'summoner/%s/runes?api_key=%s' % (summoner_id, self.api_key)
        response = json.loads(self.__webrequest(url).decode())
        return response["pages"]

    # Translates a list of up to 40 IDs into names.
    def get_summoner_names(self, summoner_ids):
        # optionally: break this into multiple calls if > 40?
        if len(summoner_ids) > 40:
            raise InputError
        if len(summoner_ids) == 0 or summoner_ids is None:
            return
        self.set_api_version('1.2')
        summoner_ids = [str(x) for x in summoner_ids]
        ids = ",".join(summoner_ids)
        url = self.api_url + 'summoner/%s/name?api_key=%s' % (ids, self.api_key)
        response = json.loads(self.__webrequest(url).decode())
        return response["summoners"]

    def get_summoner_teams(self, summoner_id=None):
        if summoner_id is None:
            if self.summoner_id is not None:
                summoner_id = self.summoner_id
            else:
                return
        self.set_api_version('2.2')
        url = self.api_url + 'team/by-summoner/%s?api_key=%s' % (summoner_id, self.api_key)
        response = json.loads(self.__webrequest(url).decode())
        return response

    def get_match_info(self, match_id):
        self.set_api_version('2.2')
        url = self.api_url + 'match/%s?api_key=%s' % (match_id, self.api_key)
        response = json.loads(self.__webrequest(url).decode())
        return response

    # Convenience function to set local summoner ID variable
    # from summoner name. All future API calls will use this
    # ID if there is none passed in.
    def set_summoner(self, summoner_name):
        summoner_id = self.get_summoner_by_name(summoner_name)["id"]
     #   print(summoner_id)
        self.summoner_id = summoner_id

    def set_summoner_id(self, summoner_id):
        # check numeric type
        self.summoner_id = summoner.id

    # Convenience functions to save typing.
    def get_games(self, summoner_id):
        return self.get_summoner_games(summoner_id)

    def get_leagues(self, summoner_id):
        return self.get_summoner_leagues(summoner_id)

    def get_stats(self, summoner_id):
        return self.get_summoner_stats(summoner_id)

    def get_ranked_stats(self, summoner_id):
        return self.get_summoner_ranked_stats(summoner_id)

    def get_summoner(self, summoner_argument):
        numeric = re.compile('\d+')
        if numeric.match(str(summoner_argument)):
            # Argument is an ID
            return self.get_summoner_by_id(summoner_argument)
        else:
            return self.get_summoner_by_name(summoner_argument)

class RiotResponse(object):
    def __init__(self, **kwargs):
        self.__dict__.update(kwargs)

    def __repr__(self):
        return '%s(%r)' % (self.__class__.__name__, self.__dict__)

class InputError(Exception):
    # Input problem. Please check your input is within the correct parameters.
    pass

class RiotError(Exception):
    def __init__(self, code):
        self.code = code
        if code == 429:
            self.error_msg = "Rate limit exceeded. Riot smash."
        else:
            self.error_msg = "Error %s from Riot servers." % code

    def __str__(self):
        return repr(self.error_msg)

class DataMismatchError(Exception):
    # Received data back for a different query than requested, e.g. summoner ID mismatch.
    pass

class NotModifiedHandler(urllib.request.BaseHandler):

    def http_error_304(self, req, fp, code, message, headers):
        addinfourl = urllib.request.addinfourl(fp, headers, req.get_full_url())
        addinfourl.code = code
        return addinfourl
