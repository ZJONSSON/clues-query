const clues = require('clues');
const Query = require('../index');

let data = require('./data');

data = Object.create(data);
data.push({'Country': 'Switzerland', 'Aspect': 'Freedom', 'sValue': 17 });
data.push({'Country': 'Greenland', 'Aspect': 'Health', 'sValue': 6 })

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
        t.same(d.count,30);
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

t.test('null values', async t => {
  t.test('no values', async t => {
    const { sum, cumul, count, min, max, avg, median } = await clues(data,'select.nValue.stats');
    t.same(sum, null, 'non-existant field has null sum');
    t.same(cumul, [], 'non-existant field does not add to cumul');
    t.same(count, 0, 'non-existant field shows as zero count');
    t.same(min, null, 'non-existant field has no min');
    t.same(max, null, 'non-existant field has no max');
    t.same(avg, null, 'non-existant field has no avg');
    t.same(median, null, 'non-existant field has no median');
  });
  t.test('mixed null and values', async t => {
    const { sum, cumul, count, min, max, avg, median } = await clues(data,'select.sValue.stats');
    t.same(sum, 23, 'mixed field sum');
    t.same(cumul, [17, 23], 'mixed field cumul');
    t.same(count, 2, 'mixed field count');
    t.same(min, 6, 'mixed field min');
    t.same(max, 17, 'mixed field max');
    t.same(avg, 11.5, 'mixed field avg');
    t.same(median, 11.5, 'mixed field median');
  });
});

};

if (!module.parent) module.exports(require('tap'));