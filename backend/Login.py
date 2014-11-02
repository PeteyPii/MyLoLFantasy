from flask import *
#from flask.ext.login import login_user , logout_user , current_user , login_required, LoginManager
import user
import databaseMethods as db
app = Flask(__name__)

app.secret_key = 'b\xb2\xd9\x81\xaf\xea\xfe\xbb\xe3\x1e\xebt3\x06\x07\x9f\xc9\xd1`\xbdG\xf1\xf8;-'

#login_manager = LoginManager()
#login_manager.init_app(app)
#login_manager.login_view = 'login'

@app.route('/signup.html', methods=['GET', 'POST'])
def AuthenticateSignUp():
  error = None
  print(request.form)
  if request.method == 'POST':
    username = request.form['username']
    password = request.form['password']
    confirmPassword = request.form['confirmPass']
    summonerID = request.form['summonerName']
    if confirmPassword == password:
      newUser = user.User(username,password,summonerID)
      data = (username, password, summonerID)
#      error = db.savenewUser(data)
      flash ("Signup Successful")
      session["logged_in"] = True
      session["username"] = username
      print(session)
      return render_template("home.html")
    else:
      error = "Passwords do not Match"
  return render_template('signup.html', error=error)

@app.route('/')
def home():

 return render_template('home.html')

@app.route('/login.html', methods =['GET', 'POST'])
def login():
  print("gothere")
  if request.method == 'GET':
    return render_template('login.html')
  username = request.form['username']
  password = request.form['password']
  data = (username, password)
  checkLogin = "Success" #db.checkLogin(data)
  if checkLogin == "Success":
    session["logged_in"] = True
    session["username"] = username
  else:
    error = "Username/Password is incorrect"
    render_template('login.html', error=error)
  return render_template('home.html')

@app.route('/home.html')
def loadhome():
 return render_template('home.html')

#@login_manager.user_loader
#def load_user(id):
#  return user.User.getUser(username)


if __name__ == '__main__':
  app.run(debug=True)
