var clues = require('clues'),
    Query = require('../index'),
    
    data = require('./data');

data = Object.create(data);

module.exports = t => {

t.test('dates',{autoend:true},function(t) {
    var facts = Object.create(data);
    
    t.test('basic filters',{autoend:true},function(t) {
      return clues(facts,'where.testDate=2020-02-01')
        .then(function(d) {
          t.ok(Query.isPrototypeOf(d),'result does not have a Query prototype');
          t.same(d.length,1);
          t.same(d[0].Aspect,'Environment');
        });
    });

    t.test('basic filters - just month in date format, but neither actually date',{autoend:true},function(t) {
      return clues(facts,'where.testDate=2020-04')
        .then(function(d) {
          t.ok(Query.isPrototypeOf(d),'result does not have a Query prototype');
          t.same(d.length,0);
        });
    });

    t.test('basic filters - just month in date format - coerced to date',{autoend:true},function(t) {
      return clues(facts,'where.date(testDate)=2020-04')
        .then(function(d) {
          t.ok(Query.isPrototypeOf(d),'result does not have a Query prototype');
          t.same(d.length,1);
          t.same(d[0].Aspect,'Infrastructure');
        });
    });
    
    t.test('basic filters - just month in date format - coerced to date',{autoend:true},function(t) {
      return clues(facts,'where.testDate=date("2020-04")')
        .then(function(d) {
          t.ok(Query.isPrototypeOf(d),'result does not have a Query prototype');
          t.same(d.length,1);
          t.same(d[0].Aspect,'Infrastructure');
        });
    });
    
    t.test('basic filters - just month in date format - precise times go to date',{autoend:true},function(t) {
      return clues(facts,'where.testDate=date("2020-04-01 12:13:15 pm")')
        .then(function(d) {
          t.ok(Query.isPrototypeOf(d),'result does not have a Query prototype');
          t.same(d.length,1);
          t.same(d[0].Aspect,'Infrastructure');
        });
    });

    t.test('date math works',{autoend:true},function(t) {
      return clues(facts,'where.adddays(testDate,4)=date("2020-04-05 12:13:15 pm")')
        .then(function(d) {
          t.ok(Query.isPrototypeOf(d),'result does not have a Query prototype');
          t.same(d.length,1);
          t.same(d[0].Aspect,'Infrastructure');
        });
    });
    
    t.test('date math works and nested',{autoend:true},function(t) {
      return clues(facts,'where.addmonths(adddays(testDate,4),3)=date("2020-07-05 12:13:15 pm")')
        .then(function(d) {
          t.ok(Query.isPrototypeOf(d),'result does not have a Query prototype');
          t.same(d.length,1);
          t.same(d[0].Aspect,'Infrastructure');
        });
    });

    t.test('date math works and nested (years)',{autoend:true},function(t) {
      return clues(facts,'where.addyears(addmonths(adddays(testDate,4),3),-1)=date("2019-07-05 12:13:15 pm")')
        .then(function(d) {
          t.ok(Query.isPrototypeOf(d),'result does not have a Query prototype');
          t.same(d.length,1);
          t.same(d[0].Aspect,'Infrastructure');
        });
    });

    t.test('date math works >',{autoend:true},function(t) {
      return clues(facts,'where.testDate>date("1990-01-01")')
        .then(function(d) {
          t.ok(Query.isPrototypeOf(d),'result does not have a Query prototype');
          t.same(d.length,3);
        });
    });

    
});

};

if (!module.parent) module.exports(require('tap'));