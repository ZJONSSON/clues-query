var clues = require('clues'),
    Query = require('../index'),
    
    data = require('./data');

var data2 = Object.create(data);
data2.push(5);
data = Object.create(data);

// Create nested promises for flattening
data.forEach(function(d,i) {
  data[i] = {
    Country : d.Country,
    Value : function() {
      return clues.Promise.resolve(d.Value);
    },
    Aspect : [data[i],function() {
      return d.Aspect;
    }],
  };

  
});

module.exports = t => {

t.test('expand',{autoend:true},function(t) {
  t.test('resolves function/promises across array',{autoend:true},function(t) {
    return clues(data,'expand')
      .then(function(d) {
        t.ok(Query.isPrototypeOf(d),'result does not have a Query prototype');
        t.same(d.length,31);
        d.forEach(function(d) {
          t.same(typeof d.Country,'string');
          t.same(typeof d.Aspect,'string');
          if (d.Aspect !== 'Undefined')
            t.same(typeof d.Value,'number');
        });
      });
  });

  t.test('doesnt break on non-objects',{autoend:true},function(t) {
    return clues(data2,'expand')
      .then(function(d) {
        t.ok(Query.isPrototypeOf(d),'result does not have a Query prototype');
        t.same(d.length,32);
        d.forEach(function(d,i) {
          if (i === 31) {
            t.same(d, 5);
            return;
          }
          t.same(typeof d.Country,'string');
          t.same(typeof d.Aspect,'string');
          if (d.Aspect !== 'Undefined')
            t.same(typeof d.Value,'number');
        });
      });
  });

  t.test('doesnt break on non-objects',{autoend:true},function(t) {
    var data3 = Object.setPrototypeOf([{a:2},6,{d:Promise.resolve(6)}], Query);
    return clues(data3,'expand')
      .then(function(d) {
        t.ok(Query.isPrototypeOf(d),'result does not have a Query prototype');
        t.same(d.length,3);
        t.same(d[1],6);
        t.same(d[0].a,2);
        t.same(d[2].d,6);
      });
  });
});
          
};

if (!module.parent) module.exports(require('tap'));