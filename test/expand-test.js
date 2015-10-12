var clues = require('clues'),
    Query = require('../index'),
    assert = require('assert'),
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

describe('expand',function() {
  it('resolves function/promises across array',function() {
    return clues(data,'expand')
      .then(function(d) {
        assert(Object.getPrototypeOf(d) === Query,'result is not Query prototype');
        assert.equal(d.length,30);
        d.forEach(function(d) {
          assert.equal(typeof d.Country,'string');
          assert.equal(typeof d.Aspect,'string');
          assert.equal(typeof d.Value,'number');
        });
      });
  });
});
          