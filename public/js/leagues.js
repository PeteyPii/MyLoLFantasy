$(document).ready(function() {
  $('#nav-leagues').addClass('active');

  $('.leagues-delete').click(function() {
    var groupName = $(this).attr('data-groupname');
    var groupId = $(this).attr('data-groupid');

    $('#confirmation-message').text('Delete group \'' + groupName + '\'? This cannot be undone.');
    $('#confirmation-popup').modal('show');
    $('#confirmation-yes').unbind();
    $('#confirmation-yes').click(function() {
      var request = $.post(gBaseUrl + '/DeleteLeague', {
        id: groupId
      });

      request.done(function(response) {
        window.location.reload();
      });
    });
  });

  $('#confirmation-no').click(function() {
    $('#confirmation-popup').modal('hide');
  });
});
