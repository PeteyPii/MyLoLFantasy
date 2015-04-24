var childProcess = require('child_process');
var http = require('http');
var os = require('os');

var express = require('express');
var open = require('open');

module.exports = function(grunt) {
  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json')
  });

  grunt.registerTask('serve', 'Task to run the MLF server in development.', function(build) {
    if (!build) {
      throw new Error('Need to set build');
    }

    if (build.toLowerCase() !== 'develop') {
      throw new Error('Not implemented');
    }

    var done = this.async();

    var supervisorCommand = 'supervisor';
    if (os.platform() === 'win32') {
      supervisorCommand += '.cmd';
    }

    childProcess.spawn(supervisorCommand, ['--extensions', 'js,jade,html,less,json', '--no-restart-on-exit', 'exit', '--quiet', 'server.js'], {
      stdio: [0, 1, 2]
    });

    // Wait for server to start up in a very crude way
    setTimeout(done, 4000);
  });

  grunt.registerTask('open', 'Task to open the app in the browser.', function() {
    console.log('Opening http://localhost in your browser');
    open('http://localhost');
  });

  grunt.registerTask('wait', 'Task to wait forever in grunt.', function() {
    console.log('Waiting forever...\n');
    this.async();
  });

  grunt.registerTask('default', ['serve:develop', 'open', 'wait']);
};
