from flask import Flask, render_template, redirect, url_for, request, flash
from flask.ext.login import login_user , logout_user , current_user , login_required, LoginManager
import user

app = Flask(__name__)

app.secret_key = 'b\xb2\xd9\x81\xaf\xea\xfe\xbb\xe3\x1e\xebt3\x06\x07\x9f\xc9\xd1`\xbdG\xf1\xf8;-'

#login_manager = LoginManager()
#login_manager.init_app(app)
#login_manager.login_view = 'login'

@app.route('/signup.html', methods=['GET', 'POST'])
def AuthenticateLogin():
  error = None
  print(request.form)
  if request.method == 'POST':
    username = request.form['username']
    password = request.form['password']
    confirmPassword = request.form['confirmPass']
  return render_template('signup.html', error=error)

@app.route('/')
def home():
 return render_template('home.html')


@app.route('/home.html')
def loadhome():
 return render_template('home.html')

#@login_manager.user_loader
#def load_user(id):
#  return user.User.getUser(username)


if __name__ == '__main__':
  app.run(debug=True)
