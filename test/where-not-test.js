var clues = require('clues'),
    Query = require('../index'),
    
    data = require('./data');

data = Object.create(data);

module.exports = t => {

t.test('where-not',{autoend:true},function(t) {
  t.test('using a string',{autoend:true},function(t) {
    var facts = Object.create(data);
    
    t.test('filters data',{autoend:true},function(t) {
      return clues(facts,'where_not.Country=France')
        .then(function(d) {
          t.ok(Query.isPrototypeOf(d),'result does not have a Query prototype');
          t.same(d.length,20);
          d.forEach(function(d) {
            t.notSame(d.Country,'France');
          });
        });
    });

    t.test('works in more than one dimension',{autoend:true},function(t) {
      return clues(facts,'where_not.Country=France|Aspect=Economy')
        .then(function(d) {
          t.same(d.length,18);
          d.forEach(function(d) {
            t.notSame(d.Country,'France');
            t.notSame(d.Aspect,'Economy');
          });
        });
    });

    t.test('works in more than one dimension with Λ as splitter',{autoend:true},function(t) {
      return clues(facts,'where_not.Country=FranceΛAspect=Economy')
        .then(function(d) {
          t.same(d.length,18);
          d.forEach(function(d) {
            t.notSame(d.Country,'France');
            t.notSame(d.Aspect,'Economy');
          });
        });
    });
  });

  t.test('using mock-sift query',{autoend:true},function(t) {
    var facts = Object.create(data);

    var filters = {
      simple : "Country=France",
      large : "Value>90"
    };

    var $global = {
      input : {
        filters : filters
      }
    };

    t.test('missing filter should fail',{autoend:true},function(t) {
      return clues(facts,'where_not.missing',$global)
        .then(function() {
          throw 'SHOULD_ERROR';
        },function(e) {
          t.same(e.message,'INVALID_FILTER');
        });
    });

    t.test('simple filter works',{autoend:true},function(t) {
      return clues(facts,'where_not.simple',$global)
       .then(function(d) {
         t.ok(Query.isPrototypeOf(d),'result does not have a Query prototype');
          t.same(d.length,20);
          d.forEach(function(d) {
            t.notSame(d.Country,'France');
          });
        });
    });

    t.test('$gt filter works',{autoend:true},function(t) {
      return clues(facts,'where_not.large',$global)
        .then(function(d) {
          t.same(d.length,20);
          d.forEach(function(d) {
            t.ok(typeof d.Value !== 'number' || d.Value <= 90,'All values higher than 90');
          });
        });
    });

  });
  
});

};

if (!module.parent) module.exports(require('tap'));
