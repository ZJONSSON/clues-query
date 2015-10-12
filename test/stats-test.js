var clues = require('clues'),
    assert = require('assert'),
    data = require('./data');

data = Object.create(data);

describe('stats',function() {
  it('works on root',function() {
    return clues(data,'stats.Value')
      .then(function(d) {
        assert.equal(d.sum,2503);
        assert.equal(d.cumul[0],55);
        assert.equal(d.cumul[d.cumul.length-1],2503);
        assert.equal(d.min,41);
        assert.equal(d.max,100);
        assert.equal(d.count,30);
      });
  });
  it('works on group data',function() {
    return clues(data,'group_by.Aspect.stats.Value')
    .then(function(d) {
      assert.equal(d.Cost_of_Living.sum,152);
    });
  });
  it('works on group-group data',function() {
    return clues(data,'group_by.Aspect.group_by.Country.stats.Value')
      .then(function(d) {
        assert.equal(d.Cost_of_Living.France.sum,55);
      });
  });
});

