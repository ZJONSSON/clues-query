var clues = require('clues'),
    Query = require('../index'),
    assert = require('assert'),
    data = require('./data');

data = Object.create(data);

describe('stats',function() {
  it('works on root',function() {
    return clues(data,'select.Value.stats')
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
    return clues(data,'group_by.Aspect.select.Value.stats')
    .then(function(d) {
      assert.equal(d.Cost_of_Living.sum,152);
    });
  });
  it('works on group-group data',function() {
    return clues(data,'group_by.Aspect.group_by.Country.select.Value.stats')
      .then(function(d) {
        assert.equal(d.Cost_of_Living.France.sum,55);
      });
  });

  it('works with $property selector',function() {
    return clues(data,'stats.Value')
      .then(function(d) {
        assert.equal(d.sum,2503);
      });
  });
});

describe('median',function() {
  it('calculates for testdata',function() {
    return clues(data,'select.Value.stats.median') 
      .then(function(d) {
        assert.equal(d,84);
      });
  });
  it('works for odd',function() {
    var data = Object.setPrototypeOf([{val:5},{val:1},{val:9}],Query);
    return clues(data,'select.val.stats.median')
      .then(function(d) {
        assert.equal(d,5);
      });
  });
  it('works for even',function() {
    var data = Object.setPrototypeOf([{val:15},{val:33},{val:5},{val:10}],Query);
    return clues(data,'select.val.stats.median')
      .then(function(d) {
        assert.equal(d,12.5);
      });
  });
});

