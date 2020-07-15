var clues = require('clues'),
    Query = require('../index'),
    
    data = require('./data');

data = Object.create(data);


// Create nested promises for flattening
data.forEach(function(d,i) {
  data[i] = d = Object.create(d);
  d.test = function() {
    return {
      a : clues.Promise.delay(100)
        .then(function() {
          var obj = {};
          obj.b = i+8;
          return obj;
        })
    };
  };
});

module.exports = t => {

t.test('select',{autoend:true},function(t) {
  t.test('simple',{autoend:true},function(t) {
    t.test('returns an array of numbers',{autoend:true},function(t) {
      return clues(data,'select.Value')
        .then(function(d) {
          t.ok(Query.isPrototypeOf(d),'result does not have a Query prototype');
          t.same(d.length,31);
          t.same(2503,d.reduce(function(p,d) {
            if (isNaN(d)) return p;
            return p+(d || 0);
          },0));
        });
    });
    t.test('returns array of objects',{autoend:true},function(t) {
      return clues(data,'select.Value=val|')
        .then(function(d) {
          t.ok(Query.isPrototypeOf(d),'result does not have a Query prototype');
          t.same(d.length,31);
          t.same(2503,d.reduce(function(p,d) {
            if (isNaN(d.val)) return p;
            return p+(d.val || 0);
          },0));          
        });
    });
  });
  t.test('joint',{autoend:true},function(t) {
    t.test('flattens object',{autoend:true},function(t) {
      return clues(data,'select.Value=val|testᐉaᐉb=no')
        .then(function(d) {
          t.ok(Query.isPrototypeOf(d),'result does not have a Query prototype');
          t.same(d.length,31);
          d.forEach(function(d,i) {
            t.same(d.no,i+8);
            t.same(d.val,data[i].Value);
          });
        });
    });

    t.test('flattens object with Λ instead of |',{autoend:true},function(t) {
      return clues(data,'select.Value=valΛtestᐉaᐉb=no')
        .then(function(d) {
          t.ok(Query.isPrototypeOf(d),'result does not have a Query prototype');
          t.same(d.length,31);
          d.forEach(function(d,i) {
            t.same(d.no,i+8);
            t.same(d.val,data[i].Value);
          });
        });
    });
  });
});

};

if (!module.parent) module.exports(require('tap'));