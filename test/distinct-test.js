var clues = require('clues'),
    Query = require('../index'),
    
    data = require('./data');

data = Object.create(data);


// Create nested promises for flattening
data.forEach(function(d,i) {
  data[i] = {
    Country : clues.Promise.resolve(d.Country),
    Value : function() {
      return clues.Promise.resolve(d.Value);
    },
    Aspect : [data[i],function() {
      return d.Aspect;
    }],
  };
 
});

module.exports = t => {

t.test('distinct',{autoend:true},function(t) {
  t.test('resolves function/promises across array',{autoend:true},function(t) {
    return clues(data,'distinct.Country')
      .then(function(d) {
        t.same(d,['France','Australia','Switzerland']);
      });
  });
});
          
};

if (!module.parent) module.exports(require('tap'));