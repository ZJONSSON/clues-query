var clues = require('clues'),
    Query = require('../index'),
    assert = require('assert'),
    data = require('./data');

data = Object.create(data);

describe('reversed',function() {
  it('returns a reversed array',function() {
    return clues(data,'reversed')
      .then(function(d) {
        assert(Object.getPrototypeOf(d) === Query,'result is not Query prototype');
        assert.deepEqual(d,data.slice().reverse());
      });
  });
});

