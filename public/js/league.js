$(document).ready(function() {
  var individualGames = false;
  $("#btn-show-details").on("click", function() {
    window.location.href = window.location.pathname + "?detailed=true";
  });
  $("#btn-hide-details").on("click", function() {
    window.location.href = window.location.pathname + "?detailed=false";
  });


  $('#individualGameStats').on("click", function() {
    $(document.getElementsByClassName("table table-league")[0]).addClass('hide');
    $(document.getElementsByClassName("table table-league-individual hide")[0]).removeClass('hide');
    $(this).addClass('hide');
    $('#allGameStats').removeClass('hide');
  });

    $('#allGameStats').on("click", function() {
    $(document.getElementsByClassName("table table-league hide")[0]).removeClass('hide');
    $(document.getElementsByClassName("table table-league-individual")[0]).addClass('hide');
    $(this).addClass('hide');
    $('#individualGameStats').removeClass('hide');
  });
});
