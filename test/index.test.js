'use strict';

const fs = require('fs');
const cpy = require('cpy');
const path = require('path');
const assert = require('assert');
const coffee = require('coffee');
const glob = require('mz-modules/glob');
const rimraf = require('mz-modules/rimraf');
const codemods = require('../');
const fixtures = path.join(__dirname, 'fixtures');
const tmp = path.join(fixtures, 'tmp');
const cwd = path.join(fixtures, 'input');
const output = path.join(fixtures, 'output');
const cmd = path.join(__dirname, '../bin/codemods');

describe('test/index.test.js', () => {
  beforeEach(function* () {
    yield cpy('**/*', tmp, { cwd, parents: true, nodir: true });
  });

  afterEach(function* () {
    yield rimraf(tmp);
  });

  function* testTransform() {
    const entry = yield glob('test/**/*.js', { cwd: tmp, nodir: true });
    for (const file of entry) {
      const expect = fs.readFileSync(path.join(output, file), 'utf8');
      const actual = fs.readFileSync(path.join(tmp, file), 'utf8');
      assert.deepEqual(actual, expect);
    }
  }

  it('should transform ok', function* () {
    yield codemods('test/**/*.js', { cwd: tmp });
    yield testTransform();
  });

  it('should execute as a cli', function* () {
    yield coffee.spawn(cmd, [ `-c ${tmp}` ])
      .debug(0)
      .expect('code', 0)
      .end();
    yield testTransform();
  });
});
