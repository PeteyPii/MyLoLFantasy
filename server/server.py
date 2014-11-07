from flask import *
import user
import database as db
import statistics
import leagueoflegends as leagueapi
app = Flask(__name__)


app.secret_key = 'b\xb2\xd9\x81\xaf\xea\xfe\xbb\xe3\x1e\xebt3\x06\x07\x9f\xc9\xd1`\xbdG\xf1\xf8;-'
lol = leagueapi.LeagueOfLegends("7c01554d-8bb6-4bcf-9857-386c552a74fa")


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


@app.route('/Signup', methods=['GET', 'POST'])
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
    confirmPassword = request.form['confirmPass']

    if password != confirmPassword:
      error = "Passwords do not match"
      return render_template('signup.html', error=error)
    elif len(password) < 1:
      error = "You must enter a password"
      return render_template('signup.html', error=error)

    summoner_name = request.form['summonerName']
    if len(summoner_name) < 1:
      error = "You must enter a summoner name"
      return render_template('signup.html', error=error)

    try:
      summoner_id = lol.get_summoner_id_from_name(summoner_name)
    except Exception as e:
      error = "The summoner does not exist or Riot failed to return their information"
      return render_template('signup.html', error=error)

    newUser = user.User(username, password, summoner_name)
    db.create_user(username, password, summoner_name)

    session["logged_in"] = False
    session["username"] = ""
    return render_template('login.html')
  else:
    return render_template('signup.html', error=error)


@app.route('/Login', methods =['GET', 'POST'])
def login():
  if request.method == 'GET':
    return render_template('login.html')
  else:
    username = request.form['username']
    password = request.form['password']
    check_pass = db.get_password(username)
    if check_pass == password:
      print(username + " successfully logged in")
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
    flash("You must be logged in to view that!")
    return redirect('Login')

  if request.method == 'GET':
    return render_template('createleague.html')
  else:
    group_name = request.form['groupName']

    if len(group_name) < 1:
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
        summoner_id = lol.get_summoner_id_from_name(player)
        summoner_ids.append(summoner_id)
      except Exception as e:
        print(e)
        error = "The summoner " + player + " does not exist or Riot failed to return their information"
        return render_template('createleague.html', error=error)

    db.create_group(session['username'], group_name, players, summoner_ids)
    return redirect('Leagues')


@app.route('/Home')
def load_home():
 return render_template('home.html')


@app.route('/Logout')
def logout():
  session.pop('logged_in', None)
  return redirect(url_for('home'))


@app.route('/Leagues')
def show_leagues():
  loggedIn = login_status()
  if loggedIn == False:
    flash("You must be logged in to view that!")
    return redirect('Login')
  leagues = db.get_groups_in(session['username'])
  for league in leagues:
    print(db.get_group_name(league))
    flash(str(league) + " " + db.get_group_name(league))
  return render_template('leagues.html')


@app.route('/League_<int:groupid>')
def show_group(groupid):
  loggedIn = login_status()
  if loggedIn == False:
    flash("You must be logged in to view that!")
    return redirect('Login')
  name = db.get_group_name(groupid)
  data = db.get_group_data(groupid)
  flash(name)
  for summoner in data:
    flash(summoner + " " + str(statistics.evaluate_points(data[summoner]["stats"])))
  return render_template('league.html')


if __name__ == '__main__':
  app.run(debug=True)
