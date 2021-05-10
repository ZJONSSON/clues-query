var clues = require('clues'),
    Query = require('../index'),
    
    data = require('./data');

data = Object.create(data);

data2 = Object.setPrototypeOf([
  { joined: 'a,b,c' },
  6,
  Promise.resolve({ joined: 'c,d,e'}),
  { joined: 'asdf' },
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
    return clues(data2,'select.joined.split')
      .then(function(d) {
        t.same(d.length,7,'Correct length for split');
        t.same(d, ['a','b','c','c','d','e','asdf'],'Correct output for split');
      });
  });
  t.test('can specify an alternate separator',{autoend:true},function(t) {
    return clues(data2,'select.joined.split.s')
      .then(function(d) {
        t.same(d.length,4,'Correct length for alternate split');
        t.same(d, ['a,b,c','c,d,e','a','df'],'Correct output for alternate split');
      });
  });
});
};

if (!module.parent) module.exports(require('tap'));