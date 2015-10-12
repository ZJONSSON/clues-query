var clues = require('clues'),
    Query = require('../index'),
    assert = require('assert'),
    data = require('./data');

data = Object.create(data);

describe('ascending',function() {
  it('returns a sorted array',function() {
    return clues(data,'ascending.Value')
      .then(function(d) {
        assert(Object.getPrototypeOf(d) === Query,'result is not Query prototype');
        assert.equal(d.length,30);

        var last = -Infinity;
        d.forEach(function(d) {
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
        assert(Object.getPrototypeOf(d) === Query,'result is not Query prototype');
        assert.equal(d.length,30);

        var last = Infinity;
        d.forEach(function(d) {
          assert(last >= d.Value,'Previous value should be higher');
          last = d.Value;
        });
      });
  });
});

