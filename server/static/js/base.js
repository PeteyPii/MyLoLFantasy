$(document).ready(function() {
  /* Log In special stuff */
  $("#login-popup").on("shown.bs.modal", function() {
    $("#login-username").focus();
  });

  $("#login-form").on("submit", function(e) {
    e.preventDefault();

    // If there was an error before, toss it
    $(".login-no-username, .login-no-password").removeClass("has-error");

    var values = {};
    jQuery.each($("#login-form input"), function(i, input) {
      values[input.name] = input.value;
    });

    var error = "";
    if (!values["username"] && !values["password"]) {
      $(".login-no-username, .login-no-password").addClass("has-error");
      error = "You must enter your username and password";
      $("#login-username").focus();
    } else if (!values["username"]) {
      $(".login-no-username").addClass("has-error");
      error = "You must enter your username";
      $("#login-username").focus();
    } else if (!values["password"]) {
      $(".login-no-password").addClass("has-error");
      error = "You must enter your password";
      $("#login-password").focus();
    }

    if (!error) {
      data = $("#login-form").serialize();
      var result = $.post("LogIn", data);

      result.done(function(val) {
        window.location.href = val ? val : window.location.pathname;
      });
      result.fail(function() {
        alert("HTTP error from server");
      });
    } else {
      $(".login-error").empty();
      $(".login-error").append("<p>" + error + "</p>");
    }
  });

  /* Sign Up special stuff */
  $("#signup-popup").on("shown.bs.modal", function() {
    $("#signup-username").focus();
  });

  $("#signup-form").on("submit", function(e) {
    e.preventDefault();

    // If there was an error before, toss it
    $(".signup-no-summoner, .signup-no-confirm-password, .signup-no-password, .signup-no-username").removeClass("has-error");

    var values = {};
    jQuery.each($("#signup-form input"), function(i, input) {
      values[input.name] = input.value;
    });

    var isError = false;
    var error = "";
    // These checks have a specific order so that the top-most unfilled input is focussed
    if (!values["summonerName"]) {
      $(".signup-no-summoner").addClass("has-error");
      $("#signup-summoner").focus();
      isError = true;
    }
    if (!values["confirmPass"]) {
      $(".signup-no-confirm-password").addClass("has-error");
      $("#signup-confirm-password").focus();
      isError = true;
    }
    if (!values["password"]) {
      $(".signup-no-password").addClass("has-error");
      $("#signup-password").focus();
      isError = true;
    }
    if (!values["username"]) {
      $(".signup-no-username").addClass("has-error");
      $("#signup-username").focus();
      isError = true;
    }

    if (isError) {
      error = "You must fill in all of the fields";
    }

    if (!isError) {
      if (values["username"].length > 128) {
        $(".signup-long-username").addClass("has-error");
        $("#signup-username").focus();
        error = "Your username cannot be more than 128 characters long";
        isError = true;
      } else if (values["password"] != values["confirmPass"]) {
        $(".signup-password-different").addClass("has-error");
        $("#signup-password").focus();
        error = "Passwords do not match";
        isError = true;
      }
    }

    if (!isError) {
      data = $("#signup-form").serialize();
      var result = $.post("SignUp", data);

      result.done(function(val) {
        window.location.href = val ? val : window.location.pathname;
      });
      result.fail(function() {
        alert("HTTP error from server");
      });
    } else {
      $(".signup-error").empty();
      $(".signup-error").append("<p>" + error + "</p>");
    }
  });

  /* Log Out click handler */
  $("#logout").click(function() {
    window.location.href = "LogOut";
  });

  // If there's an error, we want to immediately show the dialog it was from
  if ($(".login-error p").length) {
    $(".login-bad").addClass("has-error");

    // The fade class enables an animation which we don't want this single time
    $("#login-popup").removeClass("fade");
    $("#login-popup").modal();
    $("#login-popup").addClass("fade");
  } else if ($(".signup-error p").length) {
    // The fade class enables an animation which we don't want this single time
    $("#signup-popup").removeClass("fade");
    $("#signup-popup").modal();
    $("#signup-popup").addClass("fade");
  }
});
