'use strict';

const co = require('co');
const path = require('path');
const runscript = require('runscript');
const getFiles = require('./lib/get_files');

module.exports = (pattern = 'test/**/*.js', { cwd }) => {
  return co(function* () {
    cwd = cwd.trim();
    const files = yield getFiles({ pattern, cwd });
    if (!files.size) {
      return;
    }
    const fileArgs = Array.from(files).join(' ');
    const transformer = path.join(__dirname, './lib/transformer.js');
    const jscodeshiftBin = path.join(__dirname, './node_modules/.bin/jscodeshift');
    const cmd = `${jscodeshiftBin} -s -t ${transformer} ${fileArgs}`;
    yield runscript(cmd, { cwd });
  });
};
