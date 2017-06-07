var clues = require('clues'),
    Query = require('../index'),
    assert = require('assert'),
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

describe('select',function() {
  describe('simple',function() {
    it('returns an array of numbers',function() {
      return clues(data,'select.Value')
        .then(function(d) {
          assert(Query.isPrototypeOf(d),'result does not have a Query prototype');
          assert.equal(d.length,31);
          assert.equal(2503,d.reduce(function(p,d) {
            if (isNaN(d)) return p;
            return p+(d || 0);
          },0));
        });
    });
    it('returns array of objects',function() {
      return clues(data,'select.Value=val|')
        .then(function(d) {
          assert(Query.isPrototypeOf(d),'result does not have a Query prototype');
          assert.equal(d.length,31);
          assert.equal(2503,d.reduce(function(p,d) {
            if (isNaN(d.val)) return p;
            return p+(d.val || 0);
          },0));          
        });
    });
  });
  describe('joint',function() {
    it('flattens object',function() {
      return clues(data,'select.Value=val|testᐉaᐉb=no')
        .then(function(d) {
          assert(Query.isPrototypeOf(d),'result does not have a Query prototype');
          assert.equal(d.length,31);
          d.forEach(function(d,i) {
            assert.equal(d.no,i+8);
            assert.equal(d.val,data[i].Value);
          });
        });
    });

    it('flattens object with Λ instead of |',function() {
      return clues(data,'select.Value=valΛtestᐉaᐉb=no')
        .then(function(d) {
          assert(Query.isPrototypeOf(d),'result does not have a Query prototype');
          assert.equal(d.length,31);
          d.forEach(function(d,i) {
            assert.equal(d.no,i+8);
            assert.equal(d.val,data[i].Value);
          });
        });
    });
  });
});

