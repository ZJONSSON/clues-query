var clues = require('clues'),
    Query = require('../index'),
    assert = require('assert'),
    data = require('./data');

data = Object.create(data);

describe('where',function() {
  describe('using a string',function() {
    var facts = Object.create(data);
    
    it('filters data',function() {
      return clues(facts,'where.Country=France')
        .then(function(d) {
          assert(Query.isPrototypeOf(d),'result does not have a Query prototype');
          assert.equal(d.length,11);
          d.forEach(function(d) {
            assert.equal(d.Country,'France');
          });
        });
    });

    it('works in more than one dimension',function() {
      return clues(facts,'where.Country=France|Aspect=Economy')
        .then(function(d) {
          assert.equal(d.length,1);
          assert.equal(d[0].Country,'France');
          assert.equal(d[0].Aspect,'Economy');
        });
    });

    it('works in more than one dimension with Λ as splitter',function() {
      return clues(facts,'where.Country=FranceΛAspect=Economy')
        .then(function(d) {
          assert.equal(d.length,1);
          assert.equal(d[0].Country,'France');
          assert.equal(d[0].Aspect,'Economy');
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
      return clues(facts,'where.missing',$global)
        .then(function() {
          throw 'SHOULD_ERROR';
        },function(e) {
          assert.equal(e.message,'INVALID_FILTER');
        });
    });

    it('$where should fail (ban eval)',function() {
      return clues(facts,'where.where',$global)
        .then(function() {
          throw 'SHOULD_ERROR';
        },function(e) {
          assert.equal(e.message,'$WHERE_NOT_ALLOWED');
        });
    });

    it('simple filter works',function() {
      return clues(facts,'where.simple',$global)
       .then(function(d) {
         assert(Query.isPrototypeOf(d),'result does not have a Query prototype');
          assert.equal(d.length,11);
          d.forEach(function(d) {
            assert.equal(d.Country,'France');
          });
        });
    });

    it('$gt filter works',function() {
      return clues(facts,'where.large',$global)
        .then(function(d) {
          assert.equal(d.length,11);
          d.forEach(function(d) {
            assert(d.Value > 90,'All values higher than 90');
          });
        });
    });

    it('regex filter works',function() {
      return clues(facts,'where.regex',$global)
        .then(function(d) {
          assert(Query.isPrototypeOf(d),'result does not have a Query prototype');
          assert.equal(d.length,10);
          d.forEach(function(d) {
            assert.equal(d.Country,'Switzerland');
          });
        });
    });

    it('boolean true filter works',function() {
      return clues(facts,'where.primary=true',$global)
        .then(function(d) {
          assert(Query.isPrototypeOf(d),'result does not have a Query prototype');
          assert.equal(d.length,1);
          d.forEach(function(d) {
            assert.equal(d.Country,'Australia');
            assert.equal(d.Aspect, 'Health');
          });
        });
    });

    it('boolean false filter works',function() {
      return clues(facts,'where.primary=false',$global)
        .then(function(d) {
          assert(Query.isPrototypeOf(d),'result does not have a Query prototype');
          assert.equal(d.length,1);
          d.forEach(function(d) {
            assert.equal(d.Country,'Switzerland');
            assert.equal(d.Aspect, 'Infrastructure');
          });
        });
    });

  });
  
});

