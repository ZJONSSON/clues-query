var clues = require('clues'),
    Query = require('../index'),
    assert = require('assert'),
    data = require('./data');

data = Object.create(data);

data.$valueFn = s => {
  let r = "";
  for (var i = s.length - 1; i >= 0; i--) {
    r += s.charAt(i);
  }
  return r;
}

describe('valuefn',function() {
  describe('using a string',function() {
    var facts = Object.create(data);
    
    it('filters data',function() {
      return clues(facts,'where.Country=ecnarF')
        .then(function(d) {
          assert(Query.isPrototypeOf(d),'result does not have a Query prototype');
          assert.equal(d.length,11);
          d.forEach(function(d) {
            assert.equal(d.Country,'France');
          });
        });
    });

    it('works in more than one dimension',function() {
      return clues(facts,'where.Country=ecnarF|Aspect=ymonocE')
        .then(function(d) {
          assert.equal(d.length,1);
          assert.equal(d[0].Country,'France');
          assert.equal(d[0].Aspect,'Economy');
        });
    });

    it('works in more than one dimension with Λ as splitter',function() {
      return clues(facts,'where.Country=ecnarFΛAspect=ymonocE')
        .then(function(d) {
          assert.equal(d.length,1);
          assert.equal(d[0].Country,'France');
          assert.equal(d[0].Aspect,'Economy');
        });
    });
  });

  describe('where not',function() {
    var facts = Object.create(data);
    
    it('filters data',function() {
      return clues(facts,'where_not.Country=ecnarF')
        .then(function(d) {
          assert(Query.isPrototypeOf(d),'result does not have a Query prototype');
          assert.equal(d.length,20);
          d.forEach(function(d) {
            assert.notEqual(d.Country,'France');
          });
        });
    });

    it('works in more than one dimension',function() {
      return clues(facts,'where_not.Country=ecnarF|Aspect=ymonocE')
        .then(function(d) {
          assert.equal(d.length,18);
          d.forEach(function(d) {
            assert.notEqual(d.Country,'France');
            assert.notEqual(d.Aspect,'Economy');
          });
        });
    });

    it('works in more than one dimension with Λ as splitter',function() {
      return clues(facts,'where_not.Country=ecnarFΛAspect=ymonocE')
        .then(function(d) {
          assert.equal(d.length,18);
          d.forEach(function(d) {
            assert.notEqual(d.Country,'France');
            assert.notEqual(d.Aspect,'Economy');
          });
        });
    });
  });
});

