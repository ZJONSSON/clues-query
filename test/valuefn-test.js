var clues = require('clues'),
    Query = require('../index'),
    
    data = require('./data');

function reverse(s) {
  let r = "";
  for (var i = s.length - 1; i >= 0; i--) {
    r += s.charAt(i);
  }
  return r;
};

data = Object.setPrototypeOf(Object.create(data).map(d => {
  d = Object.create(d);
  d.Country = {
    wrapped: d.Country
  };
  d.Aspect = {
    wrapped: d.Aspect
  };
  return d;
}), Query);

data.$valueFn = d => {
  if (d.wrapped) return reverse(d.wrapped);
  return d;
};

module.exports = t => {

t.test('valuefn',{autoend:true},function(t) {
  t.test('using a string',{autoend:true},function(t) {
    var facts = Object.create(data);
    
    t.test('filters data',{autoend:true},function(t) {
      return clues(facts,'where.Country=ecnarF')
        .then(function(d) {
          t.ok(Query.isPrototypeOf(d),'result does not have a Query prototype');
          t.same(d.length,11);
          d.forEach(function(d) {
            t.same(d.Country.wrapped,'France');
          });
        });
    });

    t.test('works in more than one dimension',{autoend:true},function(t) {
      return clues(facts,'where.Country=ecnarF|Aspect=ymonocE')
        .then(function(d) {
          t.same(d.length,1);
          t.same(d[0].Country.wrapped,'France');
          t.same(d[0].Aspect.wrapped,'Economy');
        });
    });

    t.test('works in more than one dimension with Λ as splitter',{autoend:true},function(t) {
      return clues(facts,'where.Country=ecnarFΛAspect=ymonocE')
        .then(function(d) {
          t.same(d.length,1);
          t.same(d[0].Country.wrapped,'France');
          t.same(d[0].Aspect.wrapped,'Economy');
        });
    });
  });

  t.test('where not',{autoend:true},function(t) {
    var facts = Object.create(data);
    
    t.test('filters data',{autoend:true},function(t) {
      return clues(facts,'where_not.Country=ecnarF')
        .then(function(d) {
          t.ok(Query.isPrototypeOf(d),'result does not have a Query prototype');
          t.same(d.length,20);
          d.forEach(function(d) {
            t.notSame(d.Country.wrapped,'France');
          });
        });
    });

    t.test('works in more than one dimension',{autoend:true},function(t) {
      return clues(facts,'where_not.Country=ecnarF|Aspect=ymonocE')
        .then(function(d) {
          t.same(d.length,18);
          d.forEach(function(d) {
            t.notSame(d.Country.wrapped,'France');
            t.notSame(d.Aspect.wrapped,'Economy');
          });
        });
    });

    t.test('works in more than one dimension with Λ as splitter',{autoend:true},function(t) {
      return clues(facts,'where_not.Country=ecnarFΛAspect=ymonocE')
        .then(function(d) {
          t.same(d.length,18);
          d.forEach(function(d) {
            t.notSame(d.Country.wrapped,'France');
            t.notSame(d.Aspect.wrapped,'Economy');
          });
        });
    });
  });
});

};

if (!module.parent) module.exports(require('tap'));