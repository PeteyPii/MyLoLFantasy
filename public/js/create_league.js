$(document).ready(function() {
  $('#nav-create-league').addClass('active');

  var $form = $('#create-league-form');
  var summonerInputIdNumber = $('.summoner-input').length;
  var summonerInputIds = [];
  for (var i = 0; i < summonerInputIdNumber; i++) {
    var summonerInputId = 'summoner-input-' + i;
    summonerInputIds.push(summonerInputId);
    $('#' + summonerInputId + ' button').click((function(id) { return function() {
      // Need to do some whacky closure manipulation so that we don't get the value of the
      // id at the time of the callback creation rather than when the button is pressed
      $(this).unbind('click');
      $('#' + id).remove();
      summonerInputIds.splice(summonerInputIds.indexOf(id), 1);
      updateInputSpacing();
    }})(summonerInputId));
  }

  $('#add-summoner').click(function() {
    var summonerInputId = 'summoner-input-' + summonerInputIdNumber;
    summonerInputIdNumber++;

    var summonerInputHtml =
      '<div id="' + summonerInputId + '" class="summoner-input">' +
        '<input type="text" class="form-control" placeholder="Summoner Name"></input>' +
        '<button class="btn btn-primary" type="button">Remove</button>' +
      '</div>';

    $('#last-summoner-input-break').before(summonerInputHtml);
    summonerInputIds.push(summonerInputId);
    $('#' + summonerInputId + ' button').click(function() {
      $(this).unbind('click');
      $('#' + summonerInputId).remove();
      summonerInputIds.splice(summonerInputIds.indexOf(summonerInputId), 1);
      updateInputSpacing();
    });

    updateInputSpacing();
  });

  $form.submit(function(e) {
    e.preventDefault();

    // If there was an error before, toss it
    $('#league-name-input-div, .summoner-input').removeClass('has-error');

    var error = '';
    var postValues = {};

    postValues.leagueName = $('#league-name-input').val();

    postValues.summonerNames = [];
    $('.summoner-input input').each(function(i, input) {
      postValues.summonerNames.push(input.value);
    });

    postValues.spectatorLeague = false;

    for (var i = 0; i < summonerInputIds.length; i++) {
      var $summonerInputDiv = $('#' + summonerInputIds[i]);
      if (!$summonerInputDiv.find('input').val()) {
        error = 'You must enter valid summoner names';
        $summonerInputDiv.addClass('has-error');
      }
    }

    if (!postValues.leagueName) {
      error = 'You must enter a name for the League';
      $('#league-name-input-div').addClass('has-error');
    }

    var participantCount = summonerInputIds.length;
    if (!postValues.spectatorLeague) {
      participantCount++;
    }

    if (!error) {
      if (participantCount < 1) {
        error = 'Your league must have at least one participant';
        $('.summoner-input').addClass('has-error');
      } else if (participantCount > 12) {
        error = 'Your league cannot have more than twelve participants';
        $('.summoner-input').addClass('has-error');
      }
    }

    if (!error) {
      var request = $.post(gBaseUrl + '/CreateLeague', postValues);

      request.done(function(result) {
        if (result.success) {
          window.location.href = result.url;
        } else {
          window.location.reload();
        }
      });
    } else {
      $('.create-league-error').empty();
      $('.create-league-error').append('<p>' + error + '</p>');
    }
  });

  updateInputSpacing();

  function updateInputSpacing() {
    var $lastSummonerInputBreak = $('#last-summoner-input-break');
    if (summonerInputIds.length > 0) {
      $lastSummonerInputBreak.show();
    } else {
      $lastSummonerInputBreak.hide();
    }
  }
});
