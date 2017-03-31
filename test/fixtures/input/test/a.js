'use strict';

const mm = require('mm');
const should = require('should');

describe('test/xxx.test.js', () => {
  beforeEach(mm.restore);

  it('should ok', () => {
    const a = '123';
    const b = 123;
    const c = false;
    a.should.eql('123');
    b.should.eql(123);
    const obj = { a, b, c };
    obj.should.eql({ a, b, c });
    obj.a.should.eql(a);
    a.should.not.eql('321');
    obj.a.should.not.eql(b);
    a.should.be.ok();
    c.should.not.be.ok();
    obj.b.should.be.ok();
    obj.c.should.not.be.ok();
    should.exist(a);
    should.exist(obj.a);
    should.not.exist(c);
    should.not.exist(obj.c);
    (function() {
      throw new Error('fail');
    }).should.throw('fail');
    (() => {
      throw new Error('mock error');
    }).should.throw(/mock error/);
    (() => {
      throw new Error('mock error');
    }).should.throw();
    obj.should.have.properties('a');
    obj.should.have.properties([ 'a', 'b' ]);
    obj.should.have.properties({ a: '123', c: false });
  });
});
