'use strict';

const assert = require('assert');
const mm = require('mm');

describe('test/xxx.test.js', () => {
  beforeEach(mm.restore);

  it('should ok', () => {
    const a = '123';
    const b = 123;
    const c = false;
    assert(a === '123');
    assert(b === 123);
    const obj = { a, b, c };
    assert.deepEqual(obj, { a, b, c });
    assert.deepEqual(obj.a, a);
    assert(a !== '321');
    assert.notStrictEqual(obj.a, b);
    assert(a);
    assert(!c);
    assert(obj.b);
    assert(!obj.c);
    assert(a);
    assert(obj.a);
    assert(!c);
    assert(!obj.c);
    assert.throws(function() {
      throw new Error('fail');
    }, 'fail');
    assert.throws(() => {
      throw new Error('mock error');
    }, /mock error/);
    assert.throws(() => {
      throw new Error('mock error');
    });
    assert([ 'a' ].every(p => Object.prototype.hasOwnProperty.call(obj, p)));
    assert([ 'a', 'b' ].every(p => Object.prototype.hasOwnProperty.call(obj, p)));
    Object.keys({ a: '123', c: false }).forEach(p => assert.deepEqual((obj)[p], ({ a: '123', c: false })[p]));
    assert(Object.prototype.hasOwnProperty.call(obj, 'a'));
    assert(a.length === 3);
  });
});
