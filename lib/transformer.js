'use strict';

const debug = require('debug')('should2assert');

function importAssert(root, j) {
  // const assert = require('assert');
  const body = root.get().value.program.body;
  const hasAssert = body.some(
    statement => j.match(statement, {
      type: 'VariableDeclaration',
      declarations: [{
        type: 'VariableDeclarator',
        id: { name: 'assert' },
        init: {
          callee: { name: 'require' },
          arguments: [{ value: 'assert' }],
        },
      }],
    })
  );

  let shouldSize = root.find(j.MemberExpression)
    .filter(({ value }) => value.property.name === 'should').size();
  shouldSize += root.find(j.CallExpression)
    .filter(({ value }) => value.callee.name === 'should').size();

  // 确保引入 assert 模块
  if (!hasAssert && shouldSize > 0) {
    root.find(j.ExpressionStatement, {
      expression: {
        type: 'Literal',
        value: 'use strict',
      },
    }).insertAfter(
      j.variableDeclaration('const', [
        j.variableDeclarator(
          j.identifier('assert'),
          j.callExpression(j.identifier('require'), [ j.literal('assert') ])),
      ]));
  }
}

function notImportShould(root, j) {
  const isRequire = n => n && n.callee && n.callee.name === 'require';
  const isUnary = args => Array.isArray(args) && args.length === 1;
  const isShould = arg => arg.value === 'should';
  const isRequireShould = n => isRequire(n) && isUnary(n.arguments) && isShould(n.arguments[0]);
  // 删除 should 模块
  // const should = require('should');
  root.find(j.VariableDeclarator)
    .filter(path => isRequireShould(path.value.init))
    .remove();
  // require('should');
  root.find(j.CallExpression)
    .filter(path => isRequireShould(path.value))
    .remove();
}

module.exports = ({ path, source }, { jscodeshift: j }) => {
  debug('transform file: %s', path);
  const root = j(source);

  importAssert(root, j);
  notImportShould(root, j);

  // @example
  // a.b.should.eql('123'); => assert(a.b === '123');
  // a.b.should.eql(c) => assert.deepEqual(a.b, c);
  root.find(j.CallExpression, {
    callee: {
      object: { property: { name: 'should' } },
      property: { name: 'eql' },
    },
  }).replaceWith(path => {
    if (path.value.arguments[0].type === 'Literal') {
      return j.callExpression(
        j.identifier('assert'), [
          j.binaryExpression('===',
            path.value.callee.object.object,
            path.value.arguments[0]),
        ]);
    }
    return j.callExpression(
      j.memberExpression(
        j.identifier('assert'),
        j.identifier('deepEqual')), [
          path.value.callee.object.object,
          path.value.arguments[0],
        ]);
  });

  // @example
  // a.b.should.equal('123'); => assert(a.b === '123');
  // a.b.should.equal(c) => assert(a.b === c);
  root.find(j.CallExpression, {
    callee: {
      object: { property: { name: 'should' } },
      property: { name: 'equal' },
    },
  }).replaceWith(path => {
    return j.callExpression(
      j.identifier('assert'), [
        j.binaryExpression('===',
          path.value.callee.object.object,
          path.value.arguments[0]),
      ]);
  });

  // @example
  // a.b.should.above(123); => assert(a.b > 123);
  root.find(j.CallExpression, {
    callee: {
      object: { property: { name: 'should' } },
      property: { name: 'above' },
    },
  }).replaceWith(path => {
    return j.callExpression(
      j.identifier('assert'), [
        j.binaryExpression('>',
          path.value.callee.object.object,
          path.value.arguments[0]
        ),
      ]);
  });

  // @example
  // a.b.should.not.above(123); => assert(a.b <= 123);
  root.find(j.CallExpression, {
    callee: {
      object: {
        object: {
          property: { name: 'should' },
        },
        property: { name: 'not' },
      },
      property: { name: 'above' },
    },
  }).replaceWith(path => {
    return j.callExpression(
      j.identifier('assert'), [
        j.binaryExpression(
          '<=',
          path.value.callee.object.object.object,
          path.value.arguments[0]
        ),
      ]
    );
  });

  // @example
  // a.b.should.match(/xxx/); => assert(/xxx/.test(a.b));
  root.find(j.CallExpression, {
    callee: {
      object: { property: { name: 'should' } },
      property: { name: 'match' },
    },
  }).replaceWith(path => {
    return j.callExpression(
      j.identifier('assert'), [
        j.callExpression(
          j.memberExpression(
            path.value.arguments[0], j.identifier('test')), [
              path.value.callee.object.object,
            ]),
      ]);
  });

  // @example
  // a.b.should.containEql('xxx'); => assert(a.b.includes('xxx'));
  root.find(j.CallExpression, {
    callee: {
      object: { property: { name: 'should' } },
      property: { name: 'containEql' },
    },
  }).replaceWith(path => {
    return j.callExpression(
      j.identifier('assert'), [
        j.callExpression(
          j.memberExpression(path.value.callee.object.object, j.identifier('includes')),
          path.value.arguments),
      ]);
  });

  // @example
  // a.b.should.not.containEql('xxx'); => assert(!a.b.includes('xxx'));
  root.find(j.CallExpression, {
    callee: {
      object: {
        object: { property: { name: 'should' } },
        property: { name: 'not' },
      },
      property: { name: 'containEql' },
    },
  }).replaceWith(path => {
    return j.callExpression(
      j.identifier('assert'), [
        j.unaryExpression('!', j.callExpression(
          j.memberExpression(
            path.value.callee.object.object.object, j.identifier('includes')),
          path.value.arguments)),
      ]);
  });

  // @example
  // a.b.should.not.eql('123'); => assert(a.b !== '123');
  // a.b.should.not.eql(c) => assert.notStrictEqual(a.b, c);
  root.find(j.CallExpression, {
    callee: {
      object: {
        object: { property: { name: 'should' } },
        property: { name: 'not' },
      },
      property: { name: 'eql' },
    },
  }).replaceWith(path => {
    if (path.value.arguments[0].type === 'Literal') {
      return j.callExpression(
        j.identifier('assert'), [
          j.binaryExpression('!==',
            path.value.callee.object.object.object,
            path.value.arguments[0]
          ),
        ]);
    }
    return j.callExpression(
      j.memberExpression(
        j.identifier('assert'),
        j.identifier('notStrictEqual')), [
          path.value.callee.object.object.object,
          path.value.arguments[0],
        ]);
  });

  // @example
  // a.b.should.not.eql('123'); => assert(a.b !== '123');
  // a.b.should.not.eql(c) => assert.notStrictEqual(a.b, c);
  root.find(j.CallExpression, {
    callee: {
      object: {
        object: { property: { name: 'should' } },
        property: { name: 'not' },
      },
      property: { name: 'equal' },
    },
  }).replaceWith(path => {
    return j.callExpression(
      j.identifier('assert'), [
        j.binaryExpression('!==',
          path.value.callee.object.object.object,
          path.value.arguments[0]
        ),
      ]);
  });

  // @example
  // a.b.should.be.ok() => assert(a.b);
  // a.b.should.be.empty() => assert(a.b.length === 0);
  root.find(j.CallExpression, {
    callee: {
      object: {
        object: { property: { name: 'should' } },
        property: { name: 'be' },
      },
      property(node) {
        return /^ok|true|false|empty$/.test(node.name);
      },
    },
  }).replaceWith(path => {
    if (path.value.callee.property.name === 'false') {
      return j.callExpression(
        j.identifier('assert'), [
          j.unaryExpression('!', path.value.callee.object.object.object),
        ]);
    }
    if (path.value.callee.property.name === 'empty') {
      return j.callExpression(
        j.identifier('assert'), [
          j.binaryExpression('===',
            j.memberExpression(path.value.callee.object.object.object, j.identifier('length')),
            j.literal(0)
          ),
        ]
      );
    }
    return j.callExpression(
      j.identifier('assert'), [ path.value.callee.object.object.object ]
    );
  });
  root.find(j.CallExpression, {
    callee: {
      object: {
        object: {
          object: { property: { name: 'should' } },
          property: { name: 'not' },
        },
        property: { name: 'be' },
      },
      property: { name: 'ok' },
    },
  }).replaceWith(path => {
    return j.callExpression(
      j.identifier('assert'), [ j.unaryExpression('!', path.value.callee.object.object.object.object) ]
    );
  });
  root.find(j.CallExpression, {
    callee: {
      object: {
        object: {
          object: { property: { name: 'should' } },
          property: { name: 'be' },
        },
        property: { name: 'not' },
      },
      property: { name: 'ok' },
    },
  }).replaceWith(path => {
    return j.callExpression(
      j.identifier('assert'), [
        j.unaryExpression('!', path.value.callee.object.object.object.object),
      ]);
  });

  // @example
  // a.should.be.ok => assert(a)
  // a.should.be.true => assert(a)
  root.find(j.ExpressionStatement, {
    expression: {
      type: 'MemberExpression',
      object: {
        object: { property: { name: 'should' } },
        property: { name: 'be' },
      },
      // property: { name: 'ok' },
    },
  }).replaceWith(path => {
    if (/^ok|true$/.test(path.value.expression.property.name)) {
      return j.expressionStatement(
        j.callExpression(
          j.identifier('assert'), [ path.value.expression.object.object.object ]
        ));
    }
    if (path.value.expression.property.name === 'false') {
      return j.expressionStatement(
        j.callExpression(
          j.identifier('assert'), [
            j.unaryExpression('!', path.value.expression.object.object.object),
          ]
        ));
    }
    if (path.value.expression.property.name === 'empty') {
      return j.expressionStatement(
        j.callExpression(
          j.identifier('assert'), [
            j.binaryExpression('===',
              j.memberExpression(path.value.expression.object.object.object, j.identifier('length')),
              j.literal(0)
            ),
          ]
        ));
    }
    return path;
  });
  root.find(j.ExpressionStatement, {
    expression: {
      type: 'MemberExpression',
      object: {
        object: {
          object: { property: { name: 'should' } },
          property: { name: 'not' },
        },
        property: { name: 'be' },
      },
      property: { name: 'ok' },
    },
  }).replaceWith(path => {
    return j.expressionStatement(
      j.callExpression(
        j.identifier('assert'), [ j.unaryExpression('!', path.value.expression.object.object.object.object) ]
      ));
  });
  root.find(j.ExpressionStatement, {
    expression: {
      type: 'MemberExpression',
      object: {
        object: {
          object: { property: { name: 'should' } },
          property: { name: 'be' },
        },
        property: { name: 'not' },
      },
      property: { name: 'ok' },
    },
  }).replaceWith(path => {
    return j.expressionStatement(
      j.callExpression(
        j.identifier('assert'), [ j.unaryExpression('!', path.value.expression.object.object.object.object) ]
      ));
  });

  // @example
  // should.exist(a) => assert(a)
  // should.not.exist(a) => assert(!a)
  root.find(j.CallExpression, {
    callee: {
      object: { name: 'should' },
      property: { name: 'exist' },
    },
  }).replaceWith(path => {
    return j.callExpression(j.identifier('assert'), path.value.arguments);
  });
  root.find(j.CallExpression, {
    callee: {
      object: {
        object: { name: 'should' },
        property: { name: 'not' },
      },
      property: { name: 'exist' },
    },
  }).replaceWith(path => {
    return j.callExpression(
      j.identifier('assert'), [
        j.unaryExpression('!', path.value.arguments[0]),
      ]);
  });

  // @example
  // should.exists(a) => assert(a)
  // should.not.exists(a) => assert(!a)
  root.find(j.CallExpression, {
    callee: {
      object: { name: 'should' },
      property: { name: 'exists' },
    },
  }).replaceWith(path => {
    return j.callExpression(j.identifier('assert'), path.value.arguments);
  });
  root.find(j.CallExpression, {
    callee: {
      object: {
        object: { name: 'should' },
        property: { name: 'not' },
      },
      property: { name: 'exists' },
    },
  }).replaceWith(path => {
    return j.callExpression(
      j.identifier('assert'), [
        j.unaryExpression('!', path.value.arguments[0]),
      ]);
  });

  // @example
  // (function(){ throw new Error('fail') }).should.throw('fail'); =>
  //   assert.throws(function(){ throw new Error('fail') }, 'fail');
  root.find(j.CallExpression, {
    callee: {
      object: { property: { name: 'should' } },
      property: { name: 'throw' },
    },
  }).replaceWith(path => {
    return j.callExpression(
      j.memberExpression(
        j.identifier('assert'),
        j.identifier('throws')), [
          path.value.callee.object.object,
          ...path.value.arguments,
        ]);
  });

  // @example
  // ({ a: 1, b: 2 }).should.have.properties({a: 1}) =>
  //    Object.keys({a: 1}).forEach(p => assert.deepEqual(({ a: 1, b: 2 })[p], ({ a: 1 })[p]))
  // ({ a: 1, b: 2 }).should.have.properties('a') =>
  //    assert(([ 'a' ]).every(p => Object.prototype.hasOwnProperty.call({ a: 1, b: 2 }, p)));
  // ({ a: 1, b: 2 }).should.have.properties([ 'a', 'b' ]) =>
  //    assert(([ 'a', 'b' ]).every(p => Object.prototype.hasOwnProperty.call({ a: 1, b: 2 }, p)));
  root.find(j.CallExpression, {
    callee: {
      object: {
        object: { property: { name: 'should' } },
        property: { name: 'have' },
      },
      property: { name: 'properties' },
    },
  }).replaceWith(path => {
    let props = path.value.arguments[0];
    if (props.type === 'Literal') {
      props = j.arrayExpression([ props ]);
    }
    if (props.type === 'ArrayExpression') {
      return j.callExpression(
        j.identifier('assert'), [
          j.callExpression(
            j.memberExpression(
              props, j.identifier('every')
            ), [
              j.arrowFunctionExpression(
                [ j.identifier('p') ], j.callExpression(
                  j.memberExpression(j.memberExpression(
                    j.memberExpression(j.identifier('Object'), j.identifier('prototype')),
                    j.identifier('hasOwnProperty')), j.identifier('call')), [
                      path.value.callee.object.object.object, j.identifier('p'),
                    ])),
            ]),
        ]);
    }
    return j.callExpression(
      j.memberExpression(
        j.callExpression(
          j.memberExpression(j.identifier('Object'), j.identifier('keys')), [ props ]),
        j.identifier('forEach')
      ), [
        j.arrowFunctionExpression(
          [ j.identifier('p') ],
          j.callExpression(
            j.memberExpression(j.identifier('assert'), j.identifier('deepEqual')), [
              j.memberExpression(
                j.parenthesizedExpression(path.value.callee.object.object.object), j.identifier('p'), true
              ),
              j.memberExpression(j.parenthesizedExpression(props), j.identifier('p'), true),
            ])
        ),
      ]);
  });

  // @example
  // a.should.have.property('a') => assert(Object.prototype.hasOwnProperty.call(a, 'a'));
  root.find(j.CallExpression, {
    callee: {
      object: {
        object: { property: { name: 'should' } },
        property: { name: 'have' },
      },
      property: { name: 'property' },
    },
  }).replaceWith(path => {
    const prop = path.value.arguments[0];
    return j.callExpression(
      j.identifier('assert'), [
        j.callExpression(
          j.memberExpression(j.memberExpression(
            j.memberExpression(j.identifier('Object'), j.identifier('prototype')),
            j.identifier('hasOwnProperty')), j.identifier('call')), [
              path.value.callee.object.object.object, prop,
            ]),
      ]
    );
  });

  // @example
  // ({ a: 1, b: 2 }).should.have.keys('a', 'b') =>
  //    assert(([ 'a', 'b' ]).every(p => Object.prototype.hasOwnProperty.call({ a: 1, b: 2 }, p)));
  root.find(j.CallExpression, {
    callee: {
      object: {
        object: { property: { name: 'should' } },
        property: { name: 'have' },
      },
      property: { name: 'keys' },
    },
  }).replaceWith(path => {
    const props = j.arrayExpression(path.value.arguments);
    return j.callExpression(
      j.identifier('assert'), [
        j.callExpression(
          j.memberExpression(
            props, j.identifier('every')
          ), [
            j.arrowFunctionExpression(
              [ j.identifier('p') ],
              j.callExpression(
                j.memberExpression(j.memberExpression(
                  j.memberExpression(j.identifier('Object'), j.identifier('prototype')),
                  j.identifier('hasOwnProperty')), j.identifier('call')), [
                    path.value.callee.object.object.object, j.identifier('p'),
                  ])
            ),
          ]),
      ]);
  });

  const objectToString = j.memberExpression(j.memberExpression(
    j.memberExpression(j.identifier('Object'), j.identifier('prototype')),
    j.identifier('toString')), j.identifier('call'));

  // @example
  // offset.should.be.a.Number => assert(typeof offset === 'number')
  const types = {
    Number: 'number',
    String: 'string',
    Object: 'object',
    Boolean: 'boolean',
    Function: 'function',
  };
  root.find(j.ExpressionStatement, {
    expression: {
      type: 'MemberExpression',
      object: {
        object: {
          object: { property: { name: 'should' } },
          property: { name: 'be' },
        },
        // property: { name: 'a' },
      },
      // property: { name: 'Number' },
    },
  }).replaceWith(path => {
    const type = types[path.value.expression.property.name];
    if (type) {
      return j.expressionStatement(j.callExpression(
        j.identifier('assert'), [
          j.binaryExpression('===',
            j.unaryExpression('typeof', path.value.expression.object.object.object.object),
            j.literal(type)
          ),
        ]));
    }
    if (path.value.expression.property.name === 'Array') {
      return j.expressionStatement(j.callExpression(
        j.identifier('assert'), [
          j.callExpression(
            j.memberExpression(j.identifier('Array'), j.identifier('isArray')), [
              path.value.expression.object.object.object.object,
            ]),
        ]));
    }
    if (path.value.expression.property.name === 'Error') {
      return j.expressionStatement(j.callExpression(
        j.identifier('assert'), [
          j.binaryExpression('instanceof',
            path.value.expression.object.object.object.object,
            j.identifier('Error')),
        ]));
    }
    if (path.value.expression.property.name === 'Date') {
      return j.expressionStatement(j.callExpression(
        j.identifier('assert'), [
          j.binaryExpression('===',
            j.callExpression(objectToString, [
              path.value.expression.object.object.object.object,
            ]),
            j.literal('[object Date]')),
        ]));
    }
    return path;
  });
  root.find(j.CallExpression, {
    callee: {
      object: {
        object: {
          object: { property: { name: 'should' } },
          property: { name: 'be' },
        },
        // property: { name: 'a' },
      },
      // property: { name: 'Number' },
    },
  }).replaceWith(path => {
    const type = types[path.value.callee.property.name];
    if (type) {
      return j.callExpression(
        j.identifier('assert'), [
          j.binaryExpression('===',
            j.unaryExpression('typeof', path.value.callee.object.object.object.object),
            j.literal(type)
          ),
        ]);
    }
    if (path.value.callee.property.name === 'Array') {
      return j.callExpression(
        j.identifier('assert'), [
          j.callExpression(
            j.memberExpression(j.identifier('Array'), j.identifier('isArray')), [
              path.value.callee.object.object.object.object,
            ]),
        ]);
    }
    if (path.value.callee.property.name === 'Error') {
      return j.callExpression(
        j.identifier('assert'), [
          j.binaryExpression('instanceof',
            path.value.callee.object.object.object.object,
            j.identifier('Error')),
        ]);
    }
    if (path.value.callee.property.name === 'Date') {
      return j.callExpression(
        j.identifier('assert'), [
          j.binaryExpression('===',
            j.callExpression(objectToString, [
              path.value.callee.object.object.object.object,
            ]),
            j.literal('[object Date]')),
        ]);
    }
    if (path.value.callee.property.name === 'instanceof') {
      return j.callExpression(
        j.identifier('assert'), [
          j.binaryExpression('instanceof',
            path.value.callee.object.object.object.object,
            path.value.arguments[0]),
        ]);
    }
    return path;
  });

  // @example
  // ('123').should.not.be.a.Number => assert(typeof '123' !== 'number')
  root.find(j.ExpressionStatement, {
    expression: {
      type: 'MemberExpression',
      object: {
        object: {
          object: { property: { name: 'should' } },
          property: { name: 'not' },
        },
        property: { name: 'be' },
      },
    },
  }).replaceWith(path => {
    const type = types[path.value.expression.property.name];
    if (type) {
      return j.expressionStatement(j.callExpression(
        j.identifier('assert'), [
          j.binaryExpression('!==',
            j.unaryExpression('typeof', path.value.expression.object.object.object.object),
            j.literal(type)
          ),
        ]));
    }
    if (path.value.expression.property.name === 'Array') {
      return j.expressionStatement(j.callExpression(
        j.identifier('assert'), [
          j.unaryExpression('!', j.callExpression(
            j.memberExpression(j.identifier('Array'), j.identifier('isArray')), [
              path.value.expression.object.object.object.object,
            ])),
        ]));
    }
    if (path.value.expression.property.name === 'Error') {
      return j.expressionStatement(j.callExpression(
        j.identifier('assert'), [
          j.unaryExpression('!', j.binaryExpression('instanceof',
            path.value.expression.object.object.object.object,
            j.identifier('Error'))),
        ]));
    }
    return path;
  });

  root.find(j.ExpressionStatement, {
    expression: {
      type: 'MemberExpression',
      object: {
        object: {
          object: {
            object: { property: { name: 'should' } },
            property: { name: 'not' },
          },
          property: { name: 'be' },
        },
      },
    },
  }).replaceWith(path => {
    const type = types[path.value.expression.property.name];
    if (type) {
      return j.expressionStatement(j.callExpression(
        j.identifier('assert'), [
          j.binaryExpression('!==',
            j.unaryExpression('typeof', path.value.expression.object.object.object.object.object),
            j.literal(type)
          ),
        ]));
    }
    if (path.value.expression.property.name === 'Array') {
      return j.expressionStatement(j.callExpression(
        j.identifier('assert'), [
          j.unaryExpression('!', j.callExpression(
            j.memberExpression(j.identifier('Array'), j.identifier('isArray')), [
              path.value.expression.object.object.object.object.object,
            ])),
        ]));
    }
    if (path.value.expression.property.name === 'Error') {
      return j.expressionStatement(j.callExpression(
        j.identifier('assert'), [
          j.unaryExpression('!', j.binaryExpression('instanceof',
            path.value.expression.object.object.object.object.object,
            j.identifier('Error'))),
        ]));
    }
    if (path.value.expression.property.name === 'Date') {
      return j.expressionStatement(j.callExpression(
        j.identifier('assert'), [
          j.binaryExpression('!==',
            j.callExpression(objectToString, [
              path.value.expression.object.object.object.object.object,
            ]),
            j.literal('[object Date]')),
        ]));
    }
    return path;
  });
  root.find(j.CallExpression, {
    callee: {
      object: {
        object: {
          object: {
            object: { property: { name: 'should' } },
            property: { name: 'not' },
          },
          property: { name: 'be' },
        },
      },
    },
  }).replaceWith(path => {
    const type = types[path.value.callee.property.name];
    if (type) {
      return j.callExpression(
        j.identifier('assert'), [
          j.binaryExpression('!==',
            j.unaryExpression('typeof', path.value.callee.object.object.object.object.object),
            j.literal(type)
          ),
        ]);
    }
    if (path.value.callee.property.name === 'Array') {
      return j.callExpression(
        j.identifier('assert'), [
          j.unaryExpression('!', j.callExpression(
            j.memberExpression(j.identifier('Array'), j.identifier('isArray')), [
              path.value.callee.object.object.object.object.object,
            ])),
        ]);
    }
    if (path.value.callee.property.name === 'Error') {
      return j.callExpression(
        j.identifier('assert'), [
          j.unaryExpression('!', j.binaryExpression('instanceof',
            path.value.callee.object.object.object.object.object,
            j.identifier('Error'))),
        ]);
    }
    if (path.value.callee.property.name === 'instanceof') {
      return j.callExpression(
        j.identifier('assert'), [
          j.unaryExpression('!', j.binaryExpression('instanceof',
            path.value.callee.object.object.object.object.object,
            path.value.arguments[0])),
        ]);
    }
    if (path.value.callee.property.name === 'Date') {
      return j.callExpression(
        j.identifier('assert'), [
          j.binaryExpression('!==',
            j.callExpression(objectToString, [
              path.value.callee.object.object.object.object.object,
            ]),
            j.literal('[object Date]')),
        ]);
    }
    return path;
  });

  // @example
  // offset.should.ok => assert(offset)
  root.find(j.ExpressionStatement, {
    expression: {
      type: 'MemberExpression',
      object: { property: { name: 'should' } },
      property: { name: 'ok' },
    },
  }).replaceWith(path => {
    return j.expressionStatement(
      j.callExpression(
        j.identifier('assert'), [ path.value.expression.object.object ]));
  });

  // @example
  // a.should.length(3) => assert(a.length === 3)
  root.find(j.CallExpression, {
    callee: {
      object: { property: { name: 'should' } },
      property: { name: 'length' },
    },
  }).replaceWith(path => {
    return j.callExpression(
      j.identifier('assert'), [
        j.binaryExpression('===',
          j.memberExpression(path.value.callee.object.object, j.identifier('length')),
          path.value.arguments[0]),
      ]);
  });

  return root.toSource({
    quote: 'single',
    arrayBracketSpacing: true,
  });
};
