$(document).ready(function() {
  $("#btn-show-details").on("click", function() {
    window.location.href = window.location.pathname + "?detailed=true";
  });
  $("#btn-hide-details").on("click", function() {
    window.location.href = window.location.pathname + "?detailed=false";
  });
});
