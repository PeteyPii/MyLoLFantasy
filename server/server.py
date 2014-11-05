from flask import *
from functools import wraps
import user
import database as db
import statistics
app = Flask(__name__)

app.secret_key = 'b\xb2\xd9\x81\xaf\xea\xfe\xbb\xe3\x1e\xebt3\x06\x07\x9f\xc9\xd1`\xbdG\xf1\xf8;-'

#login_manager = LoginManager()
#login_manager.init_app(app)
#login_manager.login_view = 'login'
@app.route('/')
def home():
 return render_template('home.html')


def login_status():
  if "logged_in" in session:
    return True
  else:
    return False


@app.route('/Signup', methods=['GET', 'POST'])
def AuthenticateSignUp():
  error = None
  if request.method == 'POST':
    username = request.form['username']
    password = request.form['password']
    confirmPassword = request.form['confirmPass']
    summonerID = request.form['summonerName']
    if confirmPassword == password:
      newUser = user.User(username, password, summonerID)
      try:
        db.create_user(username, password, summonerID)
      except Exception as e:
        error = "Username is taken"
      if error == None:
        session["logged_in"] = True
        session["username"] = username
        return render_template("home.html")
      else:
        return render_template('signup.html', error=error)
    else:
      error = "Passwords do not Match"
  return render_template('signup.html', error=error)


@app.route('/Login', methods =['GET', 'POST'])
def login():
  if request.method == 'GET':
    return render_template('login.html')
  username = request.form['username']
  password = request.form['password']
  checkLogin = db.try_login(username, password)
  if checkLogin == True:
    print ("login success")
    session["logged_in"] = True
    session["username"] = username
    return redirect('Leagues')
  else:
    error = "Username/Password is incorrect"
    return render_template('login.html', error=error)


@app.route('/CreateLeague', methods=['GET','POST'])
def createLeague():
  loggedIn = login_status()
  if loggedIn == False:
    flash("You must be logged in to view that!")
    return redirect('Login')
  if request.method == 'GET':
    return render_template('createLeague.html')
  groupName = request.form['groupName']

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

  db.create_group(session['username'], groupName, players)
  return redirect('Leagues')


@app.route('/Home')
def loadhome():
 return render_template('home.html')


@app.route('/Logout')
def logout():
  session.pop('logged_in', None)
  return redirect(url_for('home'))


@app.route('/Leagues')
def showLeagues():
  loggedIn = login_status()
  if loggedIn == False:
    flash("You must be logged in to view that!")
    return redirect('Login')
  leagues = db.get_groups_in(session['username'])
  for league in leagues:
    print(db.get_group_name(league))
    flash(str(league) + " " + db.get_group_name(league))
  return render_template('leagues.html')


@app.route('/League_<groupid>')
def showgroup(groupid):
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


# @app.route('/league.html')
# def showleague():
#   return render_template('league.html')


if __name__ == '__main__':
  app.run(debug=True)
