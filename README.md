# should2assert
A tool to help you migrating from should to assert

[![NPM version][npm-image]][npm-url]
[![build status][travis-image]][travis-url]
[![Test coverage][codecov-image]][codecov-url]
[![David deps][david-image]][david-url]
[![Known Vulnerabilities][snyk-image]][snyk-url]
[![npm download][download-image]][download-url]

[npm-image]: https://img.shields.io/npm/v/should2assert.svg?style=flat-square
[npm-url]: https://npmjs.org/package/should2assert
[travis-image]: https://img.shields.io/travis/node-modules/should2assert.svg?style=flat-square
[travis-url]: https://travis-ci.org/node-modules/should2assert
[codecov-image]: https://codecov.io/gh/node-modules/should2assert/branch/master/graph/badge.svg
[codecov-url]: https://codecov.io/gh/node-modules/should2assert
[david-image]: https://img.shields.io/david/node-modules/should2assert.svg?style=flat-square
[david-url]: https://david-dm.org/node-modules/should2assert
[snyk-image]: https://snyk.io/test/npm/should2assert/badge.svg?style=flat-square
[snyk-url]: https://snyk.io/test/npm/should2assert
[download-image]: https://img.shields.io/npm/dm/should2assert.svg?style=flat-square
[download-url]: https://npmjs.org/package/should2assert

## Install

```bash
$ npm install should2assert -g
```

Node.js >= 6.0.0 required

## Usage

```
Usage
  $ should2assert [<file|glob> ...]

Options
  -c, --cwd  current working directory

Examples
  $ should2assert test
```

## Example

**input file**
```js
'use strict';

const mm = require('mm');
const should = require('should');

describe('test/xxx.test.js', () => {
  beforeEach(mm.restore);

  it('should be ok', () => {
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

    const offset = 1;
    const zero = 0;
    const str = '';
    const obj = {};
    const arr = [];
    const b = true;
    const fn = () => {};
    const err = new Error('mock error');
    const date = new Date();
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
    b.should.be.a.Boolean;
    b.should.be.a.Boolean();
    fn.should.be.a.Function;
    fn.should.be.a.Function();
    err.should.be.an.Error;
    err.should.be.an.Error();
    ('123').should.not.be.a.Number;
    ('123').should.not.be.a.Number();
    (123).should.not.be.a.String;
    (123).should.not.be.a.String();
    (123).should.not.be.a.Boolean;
    (123).should.not.be.a.Boolean();
    (123).should.not.be.a.Function;
    (123).should.not.be.a.Function();
    (123).should.not.be.a.Object;
    (123).should.not.be.a.Object();
    (123).should.not.be.an.Array;
    (123).should.not.be.an.Array();
    (123).should.not.be.an.Error;
    (123).should.not.be.an.Error();
    (123).should.not.be.Array;
    (123).should.not.be.Error;
    obj.should.not.be.Error;
    obj.should.be.an.instanceof(Object);
    (123).should.be.an.instanceof(Number);
    (123).should.not.be.an.instanceof(Object);
    obj.should.not.be.an.instanceof(Number);
    date.should.be.a.Date;
    date.should.be.a.Date();
    obj.should.not.be.a.Date;
    obj.should.not.be.a.Date();
  });
});
```

**output file**
```js
'use strict';

const assert = require('assert');
const mm = require('mm');

describe('test/xxx.test.js', () => {
  beforeEach(mm.restore);

  it('should be ok', () => {
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
    assert(['a'].every(p => Object.prototype.hasOwnProperty.call(obj, p)));
    assert(['a', 'b'].every(p => Object.prototype.hasOwnProperty.call(obj, p)));
    Object.keys({ a: '123', c: false }).forEach(p => assert.deepEqual((obj)[p], ({ a: '123', c: false })[p]));

    const offset = 1;
    const zero = 0;
    const str = '';
    const obj = {};
    const arr = [];
    const b = true;
    const fn = () => {};
    const err = new Error('mock error');
    const date = new Date();
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
    assert(typeof b === 'boolean');
    assert(typeof b === 'boolean');
    assert(typeof fn === 'function');
    assert(typeof fn === 'function');
    assert(err instanceof Error);
    assert(err instanceof Error);
    assert(typeof '123' !== 'number');
    assert(typeof '123' !== 'number');
    assert(typeof 123 !== 'string');
    assert(typeof 123 !== 'string');
    assert(typeof 123 !== 'boolean');
    assert(typeof 123 !== 'boolean');
    assert(typeof 123 !== 'function');
    assert(typeof 123 !== 'function');
    assert(typeof 123 !== 'object');
    assert(typeof 123 !== 'object');
    assert(!Array.isArray(123));
    assert(!Array.isArray(123));
    assert(!(123 instanceof Error));
    assert(!(123 instanceof Error));
    assert(!Array.isArray(123));
    assert(!(123 instanceof Error));
    assert(!(obj instanceof Error));
    assert(obj instanceof Object);
    assert(123 instanceof Number);
    assert(!(123 instanceof Object));
    assert(!(obj instanceof Number));
    assert(Object.prototype.toString.call(date) === '[object Date]');
    assert(Object.prototype.toString.call(date) === '[object Date]');
    assert(Object.prototype.toString.call(obj) !== '[object Date]');
    assert(Object.prototype.toString.call(obj) !== '[object Date]');
  });
});
```