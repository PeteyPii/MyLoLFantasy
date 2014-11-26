from flask import *
import database as db
import statistics
import leagueoflegends as leagueapi
import time
import json
import os
import threading

os.environ["PASSLIB_BUILTIN_BCRYPT"] = "enabled"
from passlib.hash import bcrypt_sha256


app = Flask(__name__)

lol_api = None


@app.route('/')
def home():
 return render_template('home.html')


def login_status():
  if "logged_in" in session:
    if session["logged_in"]:
      return True
    else:
      return False
  else:
    return False


@app.route('/SignUp', methods=['GET', 'POST'])
def sign_up():
  error = None
  if request.method == 'POST':
    username = request.form['username']
    if len(username) < 1 or len(username) > 128:
      error = "Username must be between 1 - 128 characters long"
      return render_template('signup.html', error=error)
    elif db.user_exists(username):
      error = "Username is taken"
      return render_template('signup.html', error=error)

    password = request.form['password']
    confirm_password = request.form['confirmPass']

    if password != confirm_password:
      error = "Passwords do not match"
      return render_template('signup.html', error=error)
    elif not password:
      error = "You must enter a password"
      return render_template('signup.html', error=error)

    summoner_name = request.form['summonerName']
    if not summoner_name:
      error = "You must enter a summoner name"
      return render_template('signup.html', error=error)

    try:
      summoner_id = lol_api.get_summoner_id_from_name(summoner_name)
    except Exception as e:
      error = "The summoner does not exist or Riot failed to return their information"
      return render_template('signup.html', error=error)

    password_hash = bcrypt_sha256.encrypt(password, rounds=6)
    db.create_user(username, password_hash, summoner_name)

    session["logged_in"] = False
    session["username"] = ""
    return redirect('LogIn')
  else:
    return render_template('signup.html', error=error)


@app.route('/LogIn', methods=['GET', 'POST'])
def log_in():
  if request.method == 'GET':
    error = None
    if session.get("mustLogIn", False):
      error = "You must be logged in to view that!"
      session["mustLogIn"] = False

    return render_template('login.html', error=error)
  else:
    username = request.form['username']
    password = request.form['password']

    if not db.user_exists(username):
      # Do a hash anyways so that the time takes roughly the same
      dummy_hash = "$bcrypt-sha256$2a,6$qBvBk5OzHb.TCf0hksI13O$eRKjorGlqRmbrirj8SkuQkpByTIUFdq"
      bcrypt_sha256.verify(password, dummy_hash)

      print(username + " failed to log in")
      error = "Username/Password is incorrect"
      return render_template('login.html', error=error)

    check_hash = db.get_password_hash(username)

    if bcrypt_sha256.verify(password, check_hash):
      print(" * " + username + " successfully logged in")
      session["logged_in"] = True
      session["username"] = username
      return redirect('Leagues')
    else:
      print(username + " failed to log in")
      error = "Username/Password is incorrect"
      return render_template('login.html', error=error)


@app.route('/CreateLeague', methods=['GET','POST'])
def create_league():
  loggedIn = login_status()
  if loggedIn == False:
    session["mustLogIn"] = True
    return redirect('LogIn')

  if request.method == 'GET':
    return render_template('createleague.html')
  else:
    group_name = request.form['groupName']

    if not group_name:
      error = "You must enter a group name"
      return render_template('createleague.html', error=error)
    elif len(group_name) > 128:
      error = "The group name cannot be longer than 128 characters long"
      return render_template('createleague.html', error=error)

    players = [db.get_lol_account(session['username'])]

    player1 = request.form['name1']
    if player1:
      players.append(player1)

    player2 = request.form['name2']
    if player2:
      players.append(player2)

    player3 = request.form['name3']
    if player3:
      players.append(player3)

    player4 = request.form['name4']
    if player4:
      players.append(player4)

    summoner_ids = []
    for player in players:
      try:
        summoner_id = lol_api.get_summoner_id_from_name(player)
        summoner_ids.append(summoner_id)
      except Exception as e:
        error = "The summoner " + player + " does not exist or Riot failed to return their information"
        return render_template('createleague.html', error=error)

    db.create_group(session['username'], group_name, players, summoner_ids, int(time.time()))
    return redirect('Leagues')


@app.route('/Home')
def load_home():
 return render_template('home.html')


@app.route('/LogOut')
def logout():
  session.pop('logged_in', None)
  return redirect(url_for('home'))


@app.route('/Leagues')
def show_leagues():
  loggedIn = login_status()
  if loggedIn == False:
    session["mustLogIn"] = True
    return redirect('LogIn')

  leagues = db.get_groups_in(session['username'])
  for league in leagues:
    flash(str(league) + " " + db.get_group_name(league))
  return render_template('leagues.html')


@app.route('/League_<int:group_id>')
def show_group(group_id):
  loggedIn = login_status()
  if loggedIn == False:
    session["mustLogIn"] = True
    return redirect('LogIn')

  if not db.group_exists(group_id):
    error = "This group does not exist"
    return render_template('league.html', error=error)

  creator = db.get_group_creator(group_id)
  if creator != session['username']:
    error = "You are not the owner of this league so you may not view it"
    return render_template('league.html', error=error)

  name = db.get_group_name(group_id)
  data = db.get_group_data(group_id)
  for summoner in data:
    data[summoner]["points"] = str(statistics.evaluate_points(data[summoner]["stats"]))
  return render_template('league.html', name=name, stats=data, numGames=data[next(iter(data))]["stats"]["totalGames"])


def shutdown_server():
  func = request.environ.get('werkzeug.server.shutdown')
  if func is None:
    raise RuntimeError('Not running with the Werkzeug Server')
  func()
  return


def refresh_stats_periodically(period, stop_signal):
  while True:
    print(" * Updating stats. Avoid stopping the server until completion")
    start_time = time.time()
    try:
      statistics.update_stats(lol_api)
      print(" * Updated stats on:  " + time.asctime(time.gmtime()))
    except leagueapi.RiotError as e:
      print(" * Failed to update all stats due to Riot Error: " + repr(e))
    except Exception as e:
      print(" * Failed to update all stats due to unknown error: " + repr(e))

    lol_api.reset_short_cache()
    wait_time = period - (time.time() - start_time)

    if stop_signal.is_set():
      return

    if wait_time > 0:
      if stop_signal.wait(timeout=wait_time):
        return


if __name__ == '__main__':
  valid_settings = False
  if os.path.isfile("settings.json"):
    with open("settings.json", "r") as fr:
      settings = json.load(fr)

      if "lol-api-key" not in settings or not settings["lol-api-key"]:
        print("LoL API key is not configured correctly. Set 'lol-api-key' to your key, including the dashes")
      elif "session-key" not in settings or len(settings["session-key"]) != 24:
        print("Secret session key is not configured correctly. Set 'session-key' to a secret 24-item list of integers with values between 0-255")
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
      settings["session-key"] = None
      settings["refresh-period"] = 3600
      json.dump(settings, fw)
      print("You need to configure the server before you can run it. See the file: 'settings.json'.")

  if valid_settings:
    lol_api = leagueapi.LeagueOfLegends(settings["lol-api-key"])
    app.secret_key = bytes(settings["session-key"])

    stop_signal = threading.Event()
    stats_thread = threading.Thread(target=refresh_stats_periodically, args=(settings["refresh-period"], stop_signal), daemon=True, name="Stat-Refresher")
    stats_thread.start()

    app.run(debug=True, use_reloader=False)
    print(" * Stopping server gracefully. Please wait..")
    stop_signal.set()
    stats_thread.join()
    print(" * Stat refresher stopped")
    print(" * Server shut down successfully!")
