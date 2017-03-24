'use strict';

const path = require('path');
const assert = require('assert');
const getFiles = require('../lib/get_files');
const cwd = path.join(__dirname, 'fixtures/get_files');

describe('test/get_files.test.js', () => {
  it('should get files match default pattern', function* () {
    const files = yield getFiles({ cwd });

    assert.deepEqual(files, new Set([
      path.join(cwd, 'test/index.test.js'),
      path.join(cwd, 'test/sub/sub.test.js'),
    ]));
  });

  it('should get files match explicit pattern', function* () {
    let files = yield getFiles({ pattern: 'test/**/*.js', cwd });
    assert.deepEqual(files, new Set([
      path.join(cwd, 'test/index.test.js'),
      path.join(cwd, 'test/sub/sub.test.js'),
    ]));

    files = yield getFiles({ pattern: 'test', cwd });
    assert.deepEqual(files, new Set([
      path.join(cwd, 'test/index.test.js'),
      path.join(cwd, 'test/sub/sub.test.js'),
    ]));

    files = yield getFiles({ pattern: 'test/xxx.bin', cwd });
    assert.deepEqual(files, new Set([
      path.join(cwd, 'test/xxx.bin'),
    ]));
  });
});
