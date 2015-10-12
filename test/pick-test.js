var clues = require('clues'),
    Query = require('../index'),
    assert = require('assert'),
    data = require('./data');

data = Object.create(data);

describe('pick',function() {
  it('filters data',function() {
    return clues(data,'pick.Country=France')
      .then(function(d) {
        assert(Object.getPrototypeOf(d) === Query,'result is not Query');
        assert.equal(d.length,10);
        d.forEach(function(d) {
          assert.equal(d.Country,'France');
        });
      });
  });
  it('works in more than one dimension',function() {
    return clues(data,'pick.Country=France|Aspect=Economy')
      .then(function(d) {
        assert.equal(d.length,1);
        assert.equal(d[0].Country,'France');
        assert.equal(d[0].Aspect,'Economy');
        assert.equal(data.pick._settledValue['Aspect=Economy']._settledValue.pick._settledValue['Country=France']._settledValue[0].Country,'France');
      });
  });
  
});

