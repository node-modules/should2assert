'use strict';

const path = require('path');
const glob = require('mz-modules/glob');

module.exports = function* getFiles(options = {}) {
  const { pattern = 'test/**/*.js', cwd = process.cwd() } = options;
  let entry = yield glob(pattern, { cwd, nodir: true });
  if (!entry.length && !pattern.endsWith('/**/*.js')) {
    entry = yield glob(`${pattern}/**/*.js`, { cwd, nodir: true });
  }
  const files = entry.map(file => path.join(cwd, file));
  return new Set(files);
};
