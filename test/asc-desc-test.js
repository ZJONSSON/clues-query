var clues = require('clues'),
    Query = require('../index'),
    assert = require('assert'),
    data = require('./data');

data = Object.create(data);

describe('ascending',function() {
  it('returns a sorted array',function() {
    return clues(data,'ascending.Value')
      .then(function(d) {
        assert(Query.isPrototypeOf(d),'result does not have a Query prototype');
        assert.equal(d.length,31);

        var last = -Infinity;
        d.forEach(function(d) {
          if (isNaN(d.Value)) return;
          assert(last <= d.Value,'Previous value should be less');
          last = d.Value;
        });
      });
  });
});

describe('descending',function() {
  it('returns a sorted array',function() {
    return clues(data,'descending.Value')
      .then(function(d) {
        assert(Query.isPrototypeOf(d),'result does not have a Query prototype');
        assert.equal(d.length,31);

        var last = Infinity;
        d.forEach(function(d) {
          if (isNaN(d.Value)) return;
          assert(last >= d.Value,'Previous value should be higher');
          last = d.Value;
        });
      });
  });
});

