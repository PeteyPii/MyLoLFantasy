$(document).ready(function() {
  $('#individualGameStatsBtn').on('click', function() {
    $('.table-league').hide();
    $('.table-league-individual').show();
    $(this).hide();
    $('#allGameStatsBtn').show();
  });

    $('#allGameStatsBtn').on('click', function() {
    $('.table-league').show();
    $('.table-league-individual').hide();
    $(this).hide();
    $('#individualGameStatsBtn').show();
  });
});
