'use strict';

module.exports = {
  write: true,
  prefix: '^',
  devprefix: '^',
  exclude: [
    'test/fixtures'
  ],
  dep: [
    'jscodeshift'
  ],
  devdep: [
    'mm',
    'autod',
    'egg-ci',
    'egg-bin',
    'eslint',
    'eslint-config-egg',
    'contributors'
  ],
};
