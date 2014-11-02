from flask import Flask, render_template, redirect, url_for, request
app = Flask(__name__)


@app.route('/signup.html', methods=['GET', 'POST'])
def Login():
  error = None
  print(request.form)
  if request.method == 'POST':
    if request.form['login'] != 'admin' or request.form['password'] != 'admin':
      print("we got here")
      error = 'Invalid Credentials. Please Try Again'
    else:
      return render_template('home.html')
  return render_template('signup.html', error=error)

@app.route('/')
def signup():
    return render_template('home.html')


 
if __name__ == '__main__':
  app.run(debug=True)
