var clues = require('clues'),
    Query = require('../index'),
    assert = require('assert'),
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

describe('distinct',function() {
  it('resolves function/promises across array',function() {
    return clues(data,'distinct.Country')
      .then(function(d) {
        assert.deepEqual(d,['France','Australia','Switzerland']);
      });
  });
});
          