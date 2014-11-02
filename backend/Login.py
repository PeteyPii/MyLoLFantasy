from flask import *
#from flask.ext.login import login_user , logout_user , current_user , login_required, LoginManager
from functools import wraps
import user
import databaseMethods as db
app = Flask(__name__)

app.secret_key = 'b\xb2\xd9\x81\xaf\xea\xfe\xbb\xe3\x1e\xebt3\x06\x07\x9f\xc9\xd1`\xbdG\xf1\xf8;-'

#login_manager = LoginManager()
#login_manager.init_app(app)
#login_manager.login_view = 'login'
@app.route('/')
def home():
 return render_template('home.html')


def login_requred(url):
  if "logged_in" in session:
    return True
  else:
    return False
  return wrap


@app.route('/signup.html', methods=['GET', 'POST'])
def AuthenticateSignUp():
  error = None
  if request.method == 'POST':
    username = request.form['username']
    password = request.form['password']
    confirmPassword = request.form['confirmPass']
    summonerID = request.form['summonerName']
    if confirmPassword == password:
      newUser = user.User(username,password,summonerID)
      data = (username, password, summonerID)
      try:
        db.create_user(data)
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




@app.route('/login.html', methods =['GET', 'POST'])
def login():
  print (request.method)
  if request.method == 'GET':
    return render_template('login.html')
  print("got here")
  username = request.form['username']
  password = request.form['password']
  data = (username, password)
  checkLogin = db.try_login(data)
  print (checkLogin)
  if checkLogin == True:
    print ("login success")
    session["logged_in"] = True
    session["username"] = username
  else:
    error = "Username/Password is incorrect"
    return render_template('login.html', error=error)
  return render_template('home.html')

@app.route('/home.html')
def loadhome():
 return render_template('home.html')

@app.route('/logout.html')
def logout():
  session.pop('logged_in', None)
  return redirect(url_for('home'))

#@login_manager.user_loader
#def load_user(id):
#  return user.User.getUser(username)


if __name__ == '__main__':
  app.run(debug=True)
