var clues = require('clues'),
    Query = require('../index'),
    
    data = require('./data');

data = Object.create(data);

var byAspect = data.reduce(function(p,d) {
  p[d.Aspect] = (p[d.Aspect] || []).concat(d);
  return p;
},{});

module.exports = t => {

t.test('group_by',{autoend:true},function(t) {

  t.test('groups data',{autoend:true},function(t) {
    return clues(Object.create(data),'group_by.Aspect')
      .then(function(d) {
        t.ok(Query.isPrototypeOf(d.Cost_of_Living),'result does not have a Query prototype');
        for (var key in byAspect)
          t.same(byAspect[key],d[key]);       
      });
  });

  t.test('allows secondary groups',{autoend:true},function(t){
    return clues(Object.create(data),'group_by.Aspect.group_by.Country')
      .then(function(d) {
        t.ok(Query.isPrototypeOf(d.Cost_of_Living.France),'result does not have a Query prototype');
        t.same(d.Cost_of_Living.France[0].Value,55);
      });
  });

  t.test('follows rank order when provided',{autoend:true},function(t) {
    return clues(Object.create(data),'group_by.Aspect',{input:{rank:['Economy','Health']}})
      .then(function(d) {
        t.ok(Query.isPrototypeOf(d.Economy),'result does not have a Query prototype');
        var keys = Object.keys(d);
        t.same(keys[0],'Economy');
        t.same(keys[1],'Health');
      });
  });


});


};

if (!module.parent) module.exports(require('tap'));