var clues = require('clues'),
    Query = require('../index'),
    
    data = require('./data');

data = Object.create(data);

module.exports = t => {

t.test('stats',{autoend:true},function(t) {
  t.test('works on root',{autoend:true},function(t) {
    return clues(data,'select.Value.stats')
      .then(function(d) {
        t.same(d.sum,2503);
        t.same(d.cumul[0],55);
        t.same(d.cumul[d.cumul.length-1],2503);
        t.same(d.min,41);
        t.same(d.max,100);
        t.same(d.count,31);
      });
  });
  t.test('works on group data',{autoend:true},function(t) {
    return clues(data,'group_by.Aspect.select.Value.stats')
    .then(function(d) {
      t.same(d.Cost_of_Living.sum,152);
    });
  });
  t.test('works on group-group data',{autoend:true},function(t) {
    return clues(data,'group_by.Aspect.group_by.Country.select.Value.stats')
      .then(function(d) {
        t.same(d.Cost_of_Living.France.sum,55);
      });
  });

  t.test('works with $property selector',{autoend:true},function(t) {
    return clues(data,'stats.Value')
      .then(function(d) {
        t.same(d.sum,2503);
      });
  });
});

t.test('median',{autoend:true},function(t) {
  t.test('calculates for testdata',{autoend:true},function(t) {
    return clues(data,'select.Value.stats.median') 
      .then(function(d) {
        t.same(d,84);
      });
  });
  t.test('works for odd',{autoend:true},function(t) {
    var data = Object.setPrototypeOf([{val:5},{val:1},{val:9}],Query);
    return clues(data,'select.val.stats.median')
      .then(function(d) {
        t.same(d,5);
      });
  });
  t.test('works for even',{autoend:true},function(t) {
    var data = Object.setPrototypeOf([{val:15},{val:33},{val:5},{val:10}],Query);
    return clues(data,'select.val.stats.median')
      .then(function(d) {
        t.same(d,12.5);
      });
  });
});

};

if (!module.parent) module.exports(require('tap'));