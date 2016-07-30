var childProcess = require('child_process');
var path = require('path');

var gulp = require('gulp');
var jade = require('gulp-jade');
var less = require('gulp-less');
var plumber = require('gulp-plumber');
var watch = require('gulp-watch');

var logger = require('./lib/logger.js');
var settings = require('./lib/settings.js');

jadeLocals = {
  settings: settings,
}

var paths = {
  less: 'less/theme.less',
  lessWatch: 'less/**/*.less',
  css: 'public/css/',
  jade: 'jade/**/*.jade',
  html: 'public/',
  server: ['lib/**/*.js', '*.json'],
};

var server = null;
var restarting = false;
function startServer() {
  if (server != null) {
    throw new Error('Server is already started');
  }

  server = childProcess.spawn('node', ['server.js']);

  server.stdout.on('data', function(data) {
    process.stdout.write(data);
  });

  server.stderr.on('data', function(data) {
    process.stdout.write(data);
  });
}

function restartServer(callback) {
  if (restarting) {
    return;
  }

  restarting = true;

  if (server === null) {
    startServer();
    callback(null);
    restarting = false;
    return;
  }

  server.on('exit', function() {
    server = null;
    startServer();
    callback(null);
    restarting = false;
  });

  server.kill('SIGTERM');
}

gulp.task('server', function(callback) {
  startServer();
});

gulp.task('less', function() {
  return gulp.src(paths.less)
    .pipe(less())
    .pipe(gulp.dest(paths.css));
});

gulp.task('jade', function() {
  return gulp.src(paths.jade)
    .pipe(jade({
      locals: jadeLocals,
    }))
    .pipe(gulp.dest(paths.html));
});

gulp.task('watch_less', ['less'], function() {
  // Watch is done like this so that if any Less file changes the entire
  // monolithic less file is rebuilt (which depends on everything).
  return watch(paths.lessWatch, function() {
    gulp.src(paths.less)
      .pipe(less())
      .pipe(gulp.dest(paths.css));
  });
});

gulp.task('watch_jade', function() {
  return gulp.src(paths.jade)
    .pipe(watch(paths.jade))
    .pipe(plumber())
    .pipe(jade({
      locals: jadeLocals,
    }))
    .pipe(gulp.dest(paths.html));
});

gulp.task('watch_server', function() {
  startServer();
  return watch(paths.server, function() {
    logger.log('File changed. Restarting server...');
    restartServer(function() {});
  });
});

gulp.task('watch', ['watch_less', 'watch_jade', 'watch_server']);

gulp.task('default', ['watch']);
