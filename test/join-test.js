var clues = require('clues'),
    Query = require('../index'),
    
    data = require('./data');

data = Object.create(data);

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
};

if (!module.parent) module.exports(require('tap'));