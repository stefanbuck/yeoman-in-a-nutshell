'use strict';

var path = require('path');
var mkdirp = require('mkdirp');
var rimraf = require('rimraf');
var inquirer = require('inquirer');
var fork = require('child_process').fork;
var kill = require('./lib/kill');

rimraf.sync('temp');
mkdirp.sync('temp');
process.chdir('temp');

var child = fork(path.join(__dirname, 'lib', 'yo.js'));

function sendToChild(name) {
  var args = Array.prototype.slice.call(arguments, 1);

  child.send({
    action: name,
    args: args
  });
}

child.on('message', function (msg) {
  console.log('PARENT', msg);

  var event = msg.event.split('generator:')[1];
  var data = msg.data;

  if (event === 'generators') {
    sendToChild('run', data[0].name);

  } else if (event === 'prompt') {
    inquirer.prompt(data, function (answer) {
      sendToChild('promptAnswer', answer);
    });
  } else if (event === 'npmInstall') {
    setTimeout(kill, 25000, child.pid, function () {
      console.log('Killed');
    });
  }
});

sendToChild('init');
