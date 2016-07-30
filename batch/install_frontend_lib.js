var path = require('path');

var bower = require('bower');
var fs = require('fs-extra');

var logger = require('../lib/logger.js');

var files = [
  'angular-cookies/angular-cookies.js',
  'angular-route/angular-route.js',
  'angular/angular.js',
  'bootstrap/dist/css/bootstrap-theme.css',
  'bootstrap/dist/css/bootstrap.css',
  'bootstrap/dist/fonts/glyphicons-halflings-regular.eot',
  'bootstrap/dist/fonts/glyphicons-halflings-regular.svg',
  'bootstrap/dist/fonts/glyphicons-halflings-regular.ttf',
  'bootstrap/dist/fonts/glyphicons-halflings-regular.woff',
  'bootstrap/dist/fonts/glyphicons-halflings-regular.woff2',
  'bootstrap/dist/js/bootstrap.js',
  'font-awesome/css/font-awesome.css',
  'font-awesome/fonts/FontAwesome.otf',
  'font-awesome/fonts/fontawesome-webfont.eot',
  'font-awesome/fonts/fontawesome-webfont.svg',
  'font-awesome/fonts/fontawesome-webfont.ttf',
  'font-awesome/fonts/fontawesome-webfont.woff',
  'font-awesome/fonts/fontawesome-webfont.woff2',
  'jquery/dist/jquery.js',
  'ng-dialog/css/ngDialog.css',
  'ng-dialog/js/ngDialog.js',
];

bower.commands.install(undefined, undefined, { cwd: path.join(__dirname, '..') }).on('error', logger.error).on('log', function(message) {
  // Do nothing
}).on('end', function() {
  logger.log('Installed bower dependencies');

  for (var i = 0; i < files.length; i++) {
    var file = files[i];
    var type = path.extname(file);
    switch (type) {
      case '.js':
        fs.copySync(path.join(__dirname, '../bower_components', file), path.join(__dirname, '../public/js/lib/', path.basename(file)));
        break;
      case '.css':
        fs.copySync(path.join(__dirname, '../bower_components', file), path.join(__dirname, '../public/css/', path.basename(file)));
        break;
      case '.otf':
      case '.eot':
      case '.svg':
      case '.ttf':
      case '.woff':
      case '.woff2':
        fs.copySync(path.join(__dirname, '../bower_components', file), path.join(__dirname, '../public/fonts/', path.basename(file)));
        break;
    }
  }

  logger.log('Copied all frontend dependencies to public folder');
});
