$(document).ready(function() {
  $("#nav-leagues").addClass("active");
  $(".leagues-delete").click(function() {
    var payload_source = $(this).parent();
    $("#confirmation-message").text("Delete group \'" + payload_source.attr("groupname") + "\'? This cannot be undone.");
    $("#confirmation-popup").modal("show");
    $("#confirmation-yes").unbind();
    $("#confirmation-yes").click(function() {
      payload_source.submit();
    });
  });

  $("#confirmation-no").click(function() {
    $("#confirmation-popup").modal("hide");
  });
});
