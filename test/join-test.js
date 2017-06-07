var clues = require('clues'),
    Query = require('../index'),
    assert = require('assert'),
    data = require('./data');

data = Object.create(data);

describe('join',function() {
  it('joins values into a string separated by &',function() {
    return clues(data,'distinct.Country.join')
      .then(function(d) {
        assert.deepEqual(d,'France & Australia & Switzerland');
      });
  });
});

describe('connect',function() {
  it('joins values into a string with no separation',function() {
    return clues(data,'select.Value.connect')
      .then(function(d) {
        assert.deepEqual(d,'55NOT NUMBER81697210010092100878256827176100879210087814186797810095961007781');
      });
  });
});