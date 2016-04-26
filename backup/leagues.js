$(document).ready(function() {
  $('#nav-leagues').addClass('active');

  $('.leagues-delete').click(function() {
    var leagueName = $(this).attr('data-leaguename');
    var leagueId = $(this).attr('data-leagueid');

    $('#confirmation-message').text('Delete League \'' + leagueName + '\'? This cannot be undone.');
    $('#confirmation-popup').modal('show');
    $('#confirmation-yes').click(function() {
      $(this).unbind();
      var request = $.post(gBaseUrl + '/DeleteLeague', {
        leagueId: leagueId
      });

      request.done(function(response) {
        window.location = response.url;
      });

      request.fail(function(a, b) {
        alert('fail');
      });
    });
  });

  $('#confirmation-no').click(function() {
    $('#confirmation-popup').modal('hide');
  });
});
