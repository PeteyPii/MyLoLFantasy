$(document).ready(function() {
  /* Log In special stuff */
  $('#login-popup').on('shown.bs.modal', function() {
    $('#login-username').focus();
  });

  $('#login-form').submit(function(e) {
    e.preventDefault();

    // If there was an error before, toss it
    $('#login-username-div, #login-password-div').removeClass('has-error');

    var postValues = {};
    $.each($('#login-form input'), function(i, input) {
      postValues[input.name] = input.value;
    });

    var error = '';
    if (!postValues.username && !postValues.password) {
      $('#login-username-div, #login-password-div').addClass('has-error');
      error = 'You must enter your username and password';
      $('#login-username').focus();
    } else if (!postValues.username) {
      $('#login-username-div').addClass('has-error');
      error = 'You must enter your username';
      $('#login-username').focus();
    } else if (!postValues.password) {
      $('#login-password-div').addClass('has-error');
      error = 'You must enter your password';
      $('#login-password').focus();
    }

    if (!error) {
      if (postValues.username.length > 128) {
        $('#login-username-div').addClass('has-error');
        $('#login-username').focus();
        error = 'Your username cannot be more than 128 characters long';
      }  else if (postValues.password.length > 1024) {
        $('#login-password-div').addClass('has-error');
        $('#login-password').focus();
        error = 'Password is too long';
      }
    }

    if (!error) {
      var request = $.post(gBaseUrl + '/LogIn', postValues);

      request.done(function(result) {
        if (result.success) {
          window.location.href = result.url;
        } else {
          window.location.reload();
        }
      });
    } else {
      $('.login-error').empty();
      $('.login-error').append('<p>' + error + '</p>');
    }
  });

  /* Sign Up special stuff */
  $('#signup-popup').on('shown.bs.modal', function() {
    $('#signup-username').focus();
  });

  $('#signup-form').submit(function(e) {
    e.preventDefault();

    // If there was an error before, toss it
    $('#signup-username-div, #signup-password-div, #signup-confirm-password-div, #signup-summoner-div, #signup-email-div, #signup-agree-div').removeClass('has-error');

    var postValues = {};
    $.each($('#signup-form input'), function(i, input) {
      postValues[input.name] = input.value;
    });
    postValues.agree = $('#signup-agree').is(':checked');

    var isError = false;
    var error = '';
    // These checks have a specific order so that the top-most unfilled input is focussed
    if (!postValues.summonerName) {
      $('#signup-summoner-div').addClass('has-error');
      $('#signup-summoner').focus();
      isError = true;
    }
    if (!postValues.confirmPassword) {
      $('#signup-confirm-password-div').addClass('has-error');
      $('#signup-confirm-password').focus();
      isError = true;
    }
    if (!postValues.password) {
      $('#signup-password-div').addClass('has-error');
      $('#signup-password').focus();
      isError = true;
    }
    if (!postValues.username) {
      $('#signup-username-div').addClass('has-error');
      $('#signup-username').focus();
      isError = true;
    }

    if (isError) {
      error = 'You must fill in all of the fields except for email';
    }

    if (!isError) {
      if (postValues.username.length > 128) {
        $('#signup-username-div').addClass('has-error');
        $('#signup-username').focus();
        error = 'Your username cannot be more than 128 characters long';
        isError = true;
      } else if (postValues.password != postValues.confirmPassword) {
        $('#signup-password-div, #signup-confirm-password-div').addClass('has-error');
        $('#signup-password').focus();
        error = 'Passwords do not match';
        isError = true;
      } else if (postValues.password.length > 1024) {
        $('#signup-password-div').addClass('has-error');
        $('#signup-password').focus();
        error = 'Password is too long';
        isError = true;
      } else if (postValues.email.length > 128) {
        $('#signup-email-div').addClass('has-error');
        $('#signup-email').focus();
        error = 'Your email cannot be more than 128 characters long';
        isError = true;
      } else if (!postValues.agree) {
        $('#signup-agree-div').addClass('has-error');
        $('#signup-agree').focus();
        error = 'You must accept the agreement to sign up';
        isError = true;
      }
    }

    if (!isError) {
      var request = $.post(gBaseUrl + '/SignUp', postValues);

      request.done(function(result) {
        if (result.success) {
          window.location.href = result.url;
        } else {
          window.location.reload();
        }
      });
    } else {
      $('.signup-error').empty();
      $('.signup-error').append('<p>' + error + '</p>');
    }
  });

  /* Log Out click handler */
  $('#logout').click(function() {
    var request = $.post(gBaseUrl + '/LogOut', {});
    request.done(function(result) {
      if (result.success) {
        window.location.href = result.url;
      } else {
        window.location.reload();
      }
    });
  });

  // If there's an error, we want to immediately show the dialog it was from
  if ($('.login-error p').length) {
    // The fade class enables an animation which we don't want this one time
    $('#login-popup').removeClass('fade');
    $('#login-popup').modal();
    $('#login-popup').addClass('fade');
  } else if ($('.signup-error p').length) {
    // The fade class enables an animation which we don't want this one time
    $('#signup-popup').removeClass('fade');
    $('#signup-popup').modal();
    $('#signup-popup').addClass('fade');
  }
});
