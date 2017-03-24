'use strict';

const assert = require('assert');
const should = require('should');

describe('test/b.test.js', () => {
  it('should be ok', () => {
    const offset = 1;
    const zero = 0;
    const str = '';
    const obj = {};
    const arr = [];
    assert(offset);
    offset.should.be.ok;
    offset.should.be.ok();
    zero.should.not.be.ok;
    zero.should.not.be.ok();
    zero.should.be.not.ok;
    zero.should.be.not.ok();
    offset.should.be.a.Number;
    offset.should.be.a.Number();
    str.should.be.a.String;
    str.should.be.a.String();
    obj.should.be.an.Object;
    obj.should.be.an.Object();
    arr.should.be.an.Array;
    arr.should.be.an.Array();
  });
});
