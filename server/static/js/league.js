$(document).ready(function() {
  $("#btn-toggle-details").on("click", function() {
    $("#simple-table").toggleClass("no-table");
    $("#detailed-table").toggleClass("no-table");
  });
});
