'use strict';

const assert = require('assert');

describe('test/b.test.js', () => {
  it('should be ok', () => {
    const offset = 1;
    const zero = 0;
    const str = '';
    const obj = {};
    const arr = [];
    assert(offset);
    assert(offset);
    assert(offset);
    assert(!zero);
    assert(!zero);
    assert(!zero);
    assert(!zero);
    assert(typeof offset === 'number');
    assert(typeof offset === 'number');
    assert(typeof str === 'string');
    assert(typeof str === 'string');
    assert(typeof obj === 'object');
    assert(typeof obj === 'object');
    assert(Array.isArray(arr));
    assert(Array.isArray(arr));
  });
});
