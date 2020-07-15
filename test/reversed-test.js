var clues = require('clues'),
    Query = require('../index'),
    
    data = require('./data');

data = Object.create(data);

module.exports = t => {

t.test('reversed',{autoend:true},function(t) {
  t.test('returns a reversed array',{autoend:true},function(t) {
    return clues(data,'reversed')
      .then(function(d) {
        t.ok(Query.isPrototypeOf(d),'result does not have a Query prototype');
        t.same(d,data.slice().reverse());
      });
  });
});


};

if (!module.parent) module.exports(require('tap'));