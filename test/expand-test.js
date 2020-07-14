var clues = require('clues'),
    Query = require('../index'),
    
    data = require('./data');

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
});
          
};

if (!module.parent) module.exports(require('tap'));