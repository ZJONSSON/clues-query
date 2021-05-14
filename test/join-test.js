var clues = require('clues'),
    Query = require('../index'),
    
    data = require('./data');

data = Object.create(data);

data2 = Object.setPrototypeOf([
  { joined: 'a,b,c', nonstrings: 13, deep: { 
    joined: 'j,k,l^q', paren: 'joined', deeper: { deeperer: { deeperest: { joined: 'x^y^z'}}}}},
  6,
  Promise.resolve({ joined: 'c,d,e', nonstrings: { a: 1 }}),
  { joined: 'asdf', nonstrings: undefined },
  null,
  "some string",
  undefined,
  false,
  0
], Query);

module.exports = t => {

t.test('join',{autoend:true},function(t) {
  t.test('joins values into a string separated by &',{autoend:true},function(t) {
    return clues(data,'distinct.Country.join')
      .then(function(d) {
        t.same(d,'France & Australia & Switzerland');
      });
  });
});

t.test('connect',{autoend:true},function(t) {
  t.test('joins values into a string with no separation',{autoend:true},function(t) {
    return clues(data,'select.Value.connect')
      .then(function(d) {
        t.same(d,'55NOT NUMBER81697210010092100878256827176100879210087814186797810095961007781');
      });
  });
});

t.test('split',{autoend:true}, function(t) {
  t.test('uses , as a default separator',{autoend:true},function(t) {
    return clues(data2,'select.split(joined)')
      .then(function(d) {
        t.same(d, [['a','b','c'],undefined,['c','d','e'],['asdf'],undefined,undefined,undefined,undefined,undefined],'Correct output for split');
      });
  });
  t.test('can specify an alternate separator',{autoend:true},function(t) {
    return clues(data2,'select.split(joined,"s")')
      .then(function(d) {
        t.same(d, [['a,b,c'],undefined,['c,d,e'],['a','df'],undefined,undefined,undefined,undefined,undefined],'Correct output for alternate split');
      });
  });
  t.test('alternate separator works without quotes',{autoend:true},function(t) {
    return clues(data2,'select.split(joined,s)')
      .then(function(d) {
        t.same(d, [['a,b,c'],undefined,['c,d,e'],['a','df'],undefined,undefined,undefined,undefined,undefined],'Correct output for alternate split');
      });
  });
  t.test('works with deeper paths',{autoend:true},function(t) {
    return clues(data2,'select.split(deep.deeper.deeperer.deeperest.joined,"^")')
      .then(function(d) {
        t.same(d, [['x','y','z'],undefined,undefined,undefined,undefined,undefined,undefined,undefined,undefined],'Deeper paths');
      });
  });

  t.test('works with nested deeper paths',{autoend:true},function(t) {
    return clues(data2,'select.split((deep.paren))')
      .then(function(d) {
        t.same(d, [['a','b','c'],undefined,undefined,undefined,undefined,undefined,undefined,undefined,undefined],'Correct output for alternate split');
      });
  });
  t.test('works with nested deeper paths with optional separator',{autoend:true},function(t) {
    return clues(data2,'select.split((deep.paren),"b")')
      .then(function(d) {
        t.same(d, [['a,',',c'],undefined,undefined,undefined,undefined,undefined,undefined,undefined,undefined],'Correct output for alternate split');
      });
  });

  t.test('splitting non-strings simply returns the field',{autoend:true},function(t) {
    return clues(data2,'select.split(nonstrings)')
      .then(function(d) {
        t.same(d, [13,undefined,{a: 1},undefined,undefined,undefined,undefined,undefined,undefined], 'Splitting non-strings');
      });
  });
  t.test('ignores if not called as an operation',{autoend:true},function(t) {
    return clues(data2,'select.split')
      .then(function(d) {
        t.same(d.length, 9, 'non-operation does not break');
        d.forEach(c => {
          t.same(c, undefined, 'non-operation does not break for each record');
        });
      });
  });
  t.test('will reject if invoked with no operands',{autoend:true},function(t) {
    return t.rejects(clues(data2,'select.split()'));
  });
});
};

if (!module.parent) module.exports(require('tap'));