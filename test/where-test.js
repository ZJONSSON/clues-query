var clues = require('clues'),
    Query = require('../index'),
    
    data = require('./data');

data = Object.create(data);

module.exports = t => {

t.test('where',{autoend:true},function(t) {
  t.test('using a string',{autoend:true},function(t) {
    var facts = Object.create(data);
    
    t.test('filters data',{autoend:true},function(t) {
      return clues(facts,'where.Country=France')
        .then(function(d) {
          t.ok(Query.isPrototypeOf(d),'result does not have a Query prototype');
          t.same(d.length,11);
          d.forEach(function(d) {
            t.same(d.Country,'France');
          });
        });
    });

    t.test('works in more than one dimension',{autoend:true},function(t) {
      return clues(facts,'where.Country=France|Aspect=Economy')
        .then(function(d) {
          t.same(d.length,1);
          t.same(d[0].Country,'France');
          t.same(d[0].Aspect,'Economy');
        });
    });

    t.test('works in more than one dimension with Λ as splitter',{autoend:true},function(t) {
      return clues(facts,'where.Country=FranceΛAspect=Economy')
        .then(function(d) {
          t.same(d.length,1);
          t.same(d[0].Country,'France');
          t.same(d[0].Aspect,'Economy');
        });
    });
  });

  t.test('using sift query',{autoend:true},function(t) {
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

    t.test('missing filter should fail',{autoend:true},function(t) {
      return clues(facts,'where.missing',$global)
        .then(function() {
          throw 'SHOULD_ERROR';
        },function(e) {
          t.same(e.message,'INVALID_FILTER');
        });
    });

    t.test('$where should fail (ban eval)',{autoend:true},function(t) {
      return clues(facts,'where.where',$global)
        .then(function() {
          throw 'SHOULD_ERROR';
        },function(e) {
          t.same(e.message,'$WHERE_NOT_ALLOWED');
        });
    });

    t.test('simple filter works',{autoend:true},function(t) {
      return clues(facts,'where.simple',$global)
       .then(function(d) {
         t.ok(Query.isPrototypeOf(d),'result does not have a Query prototype');
          t.same(d.length,11);
          d.forEach(function(d) {
            t.same(d.Country,'France');
          });
        });
    });

    t.test('$gt filter works',{autoend:true},function(t) {
      return clues(facts,'where.large',$global)
        .then(function(d) {
          t.same(d.length,11);
          d.forEach(function(d) {
            t.ok(d.Value > 90,'All values higher than 90');
          });
        });
    });

    t.test('regex filter works',{autoend:true},function(t) {
      return clues(facts,'where.regex',$global)
        .then(function(d) {
          t.ok(Query.isPrototypeOf(d),'result does not have a Query prototype');
          t.same(d.length,10);
          d.forEach(function(d) {
            t.same(d.Country,'Switzerland');
          });
        });
    });

    t.test('boolean true filter works',{autoend:true},function(t) {
      return clues(facts,'where.primary=true',$global)
        .then(function(d) {
          t.ok(Query.isPrototypeOf(d),'result does not have a Query prototype');
          t.same(d.length,1);
          d.forEach(function(d) {
            t.same(d.Country,'Australia');
            t.same(d.Aspect, 'Health');
          });
        });
    });

    t.test('boolean false filter works',{autoend:true},function(t) {
      return clues(facts,'where.primary=false',$global)
        .then(function(d) {
          t.ok(Query.isPrototypeOf(d),'result does not have a Query prototype');
          t.same(d.length,1);
          d.forEach(function(d) {
            t.same(d.Country,'Switzerland');
            t.same(d.Aspect, 'Infrastructure');
          });
        });
    });

  });
  
});

};

if (!module.parent) module.exports(require('tap'));
