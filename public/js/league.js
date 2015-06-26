$(document).ready(function() {
  var individualGames = false;
  $("#btn-show-details").on("click", function() {
    window.location.href = window.location.pathname + "?detailed=true";
  });
  $("#btn-hide-details").on("click", function() {
    window.location.href = window.location.pathname + "?detailed=false";
  });


  $('#individualGameStatsBtn').on("click", function() {
    $(document.getElementsByClassName("table table-league")[0]).hide();
    $(document.getElementsByClassName("table table-league-individual")[0]).show();
    $(this).hide();
    $('#allGameStatsBtn').show();
  });

    $('#allGameStatsBtn').on("click", function() {
    $(document.getElementsByClassName("table table-league")[0]).show();
    $(document.getElementsByClassName("table table-league-individual")[0]).hide();
    $(this).hide();
    $('#individualGameStatsBtn').show();
  });
});
