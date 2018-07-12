var childProcess = require('child_process');
var path = require('path');

var clean = require('gulp-clean');
var cleanCss = require('gulp-clean-css');
var concat = require('gulp-concat');
var copy = require('gulp-copy');
var gulp = require('gulp');
var jade = require('gulp-jade');
var jshint = require('gulp-jshint');
var less = require('gulp-less');
var lesshint = require('gulp-lesshint');
var merge = require('merge-stream');
var plumber = require('gulp-plumber');
var uglify = require('gulp-uglify');
var watch = require('gulp-watch');

var bowerInstall = require('./lib/bower_install.js');
var logger = require('./lib/logger.js');
var settings = require('./lib/settings.js');
var version = require('./lib/version.js');
var frontEndDependencies = require('./lib/front_end_deps.js');

var jadeLocals = {
  settings: settings,
  version: version,
  deps: frontEndDependencies,
};

var paths = {};
paths.lessMain = 'less/theme.less';
paths.lessAll = 'less/**/*.less';
paths.css = 'public/css/';
paths.jade = 'jade/**/*.jade';
paths.html = 'public/';
paths.serverJs = ['server.js', 'lib/**/*.js'];
paths.publicJs = ['public/js/**/*.js', '!public/js/lib/**/*.js'];
paths.server = concatenateItems(paths.serverJs, '*.json', '!bower.json');
paths.js = concatenateItems('gulpfile.js', 'batch/**/*.js', paths.serverJs, paths.publicJs);
paths.misc = ['node_modules/**/*'];
paths.assets = ['public/imgs/**/*', 'public/fonts/**/*', 'public/**/*.html'];
paths.public = 'public/';
paths.build = 'dist/';
paths.buildJsHead = 'dist/public/js/bundle_head.js';
paths.buildJsFinal = 'dist/public/js/bundle_final.js';
paths.buildCss = 'dist/public/css/bundle.css';

function concatenateItems() {
  var itemList = [];
  for (var i = 0; i < arguments.length; i++) {
    itemList = itemList.concat(arguments[i]);
  }
  return itemList;
}

var server = null;
var restarting = false;
function startServer() {
  if (server !== null) {
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

gulp.task('bower', function(callback) {
  bowerInstall(callback);
});

gulp.task('server', function(callback) {
  startServer();
});

gulp.task('less', function() {
  return gulp.src(paths.lessMain)
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
  // Watch is done like this so that if any Less file changes, the entire
  // monolithic less file is rebuilt (which depends on everything).
  return watch(paths.lessAll, function() {
    gulp.src(paths.lessMain)
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

gulp.task('lint_js', function() {
  return gulp.src(paths.js)
    .pipe(jshint())
    .pipe(jshint.reporter('default'));
});

gulp.task('lint_less', function() {
  return gulp.src(paths.lessAll)
    .pipe(lesshint())
    .pipe(lesshint.reporter());
});

gulp.task('lint', ['lint_js', 'lint_less']);

gulp.task('build_server', function() {
  return gulp.src(paths.server)
    .pipe(copy(paths.build));
});

gulp.task('build_misc', function() {
  return gulp.src(paths.misc)
    .pipe(copy(paths.build));
});

gulp.task('build_assets', ['bower', 'jade'], function() {
  return gulp.src(paths.assets)
    .pipe(copy(paths.build));
});

gulp.task('build_js', ['bower'], function() {
  var headFiles = frontEndDependencies.headJs.map(function(fileName) {
    return paths.public + fileName;
  });
  var finalFiles = frontEndDependencies.finalJs.map(function(fileName) {
    return paths.public + fileName;
  });

  var head = gulp.src(headFiles)
    .pipe(concat(paths.buildJsHead))
    .pipe(uglify())
    .pipe(gulp.dest('.'));
  var final = gulp.src(finalFiles)
    .pipe(concat(paths.buildJsFinal))
    .pipe(uglify())
    .pipe(gulp.dest('.'));
  return merge(head, final);
});

gulp.task('build_css', ['bower', 'less'], function() {
  var files = frontEndDependencies.css.map(function(fileName) {
    return paths.public + fileName;
  });

  return gulp.src(files)
    .pipe(concat(paths.buildCss))
    .pipe(cleanCss({
      keepSpecialComments: 0,
    }))
    .pipe(gulp.dest('.'));
});

gulp.task('build', ['build_server', 'build_misc', 'build_assets', 'build_js', 'build_css']);

gulp.task('clean', function() {
  return gulp.src(paths.build, { read: false })
    .pipe(clean());
});

gulp.task('default', ['watch']);
