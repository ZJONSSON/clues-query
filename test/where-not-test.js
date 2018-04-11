var clues = require('clues'),
    Query = require('../index'),
    assert = require('assert'),
    data = require('./data');

data = Object.create(data);

describe('where-not',function() {
  describe('using a string',function() {
    var facts = Object.create(data);
    
    it('filters data',function() {
      return clues(facts,'where_not.Country=France')
        .then(function(d) {
          assert(Query.isPrototypeOf(d),'result does not have a Query prototype');
          assert.equal(d.length,20);
          d.forEach(function(d) {
            assert.notEqual(d.Country,'France');
          });
        });
    });

    it('works in more than one dimension',function() {
      return clues(facts,'where_not.Country=France|Aspect=Economy')
        .then(function(d) {
          assert.equal(d.length,18);
          d.forEach(function(d) {
            assert.notEqual(d.Country,'France');
            assert.notEqual(d.Aspect,'Economy');
          });
        });
    });

    it('works in more than one dimension with Λ as splitter',function() {
      return clues(facts,'where_not.Country=FranceΛAspect=Economy')
        .then(function(d) {
          assert.equal(d.length,18);
          d.forEach(function(d) {
            assert.notEqual(d.Country,'France');
            assert.notEqual(d.Aspect,'Economy');
          });
        });
    });
  });

  describe('using sift query',function() {
    var facts = Object.create(data);

    var filters = {
      simple : {
        Country: 'France'
      },
      large : {
        Value : {
          $gt : 90
        }
      },
      regex : {
        Country : {
          $regex: /tzer/
        }
      },
      where : {
        $where : 'this.Country === "France"'
      }
    };

    var $global = {
      input : {
        filters : filters
      }
    };

    it('missing filter should fail',function() {
      return clues(facts,'where_not.missing',$global)
        .then(function() {
          throw 'SHOULD_ERROR';
        },function(e) {
          assert.equal(e.message,'INVALID_FILTER');
        });
    });

    it('$where should fail (ban eval)',function() {
      return clues(facts,'where_not.where',$global)
        .then(function() {
          throw 'SHOULD_ERROR';
        },function(e) {
          assert.equal(e.message,'$WHERE_NOT_ALLOWED');
        });
    });

    it('simple filter works',function() {
      return clues(facts,'where_not.simple',$global)
       .then(function(d) {
         assert(Query.isPrototypeOf(d),'result does not have a Query prototype');
          assert.equal(d.length,20);
          d.forEach(function(d) {
            assert.notEqual(d.Country,'France');
          });
        });
    });

    it('$gt filter works',function() {
      return clues(facts,'where_not.large',$global)
        .then(function(d) {
          assert.equal(d.length,20);
          d.forEach(function(d) {
            assert(typeof d.Value !== 'number' || d.Value <= 90,'All values higher than 90');
          });
        });
    });

    it('regex filter works',function() {
      return clues(facts,'where_not.regex',$global)
        .then(function(d) {
          assert(Query.isPrototypeOf(d),'result does not have a Query prototype');
          assert.equal(d.length,21);
          d.forEach(function(d) {
            assert.notEqual(d.Country,'Switzerland');
          });
        });
    });

  });
  
});

