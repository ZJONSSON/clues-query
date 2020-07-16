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

     t.test('nested',{autoend:true},function(t) {
      return clues(facts,'where.or(and(Country=France|Aspect=Economy)|and(Country=Australia|not(Aspect=Freedom)))')
        .then(function(d) {
          t.same(d.length,10);
          t.same(d[0].Country,'France');
          t.same(d[0].Aspect,'Economy');
          for (var i = 1; i < 10; i++) {
            t.same(d[i].Country,'Australia');
            t.notSame(d[1].Aspect,'Freedom');
          }
        });
     });


     t.test('<',{autoend:true},function(t) {
      return clues(facts,'where.Value<100')
        .then(function(d) {
          t.same(d.length,23);
          for (var i = 1; i < 23; i++) {
            t.ok(d[i].Value<100,'Less than 100');
          }
        });
     });

     t.test('<=',{autoend:true},function(t) {
      return clues(facts,'where.Value<=100')
        .then(function(d) {
          t.same(d.length,30);
          for (var i = 1; i < 30; i++) {
            t.ok(d[i].Value<=100,'Less than or equal to 100');
          }
        });
     });

     t.test('>',{autoend:true},function(t) {
      return clues(facts,'where.Value>92')
        .then(function(d) {
          t.same(d.length,9);
          for (var i = 1; i < 9; i++) {
            t.ok(d[i].Value>92,'greater than 92');
          }
        });
     });

     t.test('>=',{autoend:true},function(t) {
      return clues(facts,'where.Value>=92')
        .then(function(d) {
          t.same(d.length,11);
          for (var i = 1; i < 11; i++) {
            t.ok(d[i].Value>=92,'greater or equal to 92');
          }
        });
     });

     t.test('!=',{autoend:true},function(t) {
      return clues(facts,'where.Value!=92')
        .then(function(d) {
          t.same(d.length,29);
          for (var i = 1; i < 20; i++) {
            t.ok(d[i].Value!==92,'not 92');
          }
        });
     });


     t.test('$exists',{autoend:true},function(t) {
      return clues(facts,'where.primary=$exists')
        .then(function(d) {
          t.same(d.length,2);
          for (var i = 1; i < 2; i++) {
            t.ok(d[i].primary !== undefined,'primary exists');
          }
        });
     });

     t.test('doesnt $exists',{autoend:true},function(t) {
      return clues(facts,'where.primary!=$exists')
        .then(function(d) {
          t.same(d.length,29);
          for (var i = 1; i < 2; i++) {
            t.ok(d[i].primary === undefined,'primary doesn\'t exists');
          }
        });
     });

     t.test("string quoted",{autoend:true},function(t) {
      return clues(facts,'where.complex="This is a... really complicated \\"thing\\"!"')
        .then(function(d) {
          t.same(d.length,1);
          t.same(d[0].complex, 'This is a... really complicated "thing"!');
        });
     });


     t.test("nested string quoted",{autoend:true},function(t) {
      return clues(facts,'where.and(Value<90|complex="This is a... really complicated \\"thing\\"!")')
        .then(function(d) {
          t.same(d.length,1);
          t.same(d[0].complex, 'This is a... really complicated "thing"!');
        });
     });


     t.test('works in more than one dimension with Λ as splitter and value from global',{autoend:true},function(t) {
      var $global = {
        mycountry: {
          is: 'France'
        }
      };
      return clues(Object.create(data),'where.Country=${mycountry.is}ΛAspect=Economy', $global)
        .then(function(d) {
          t.same(d.length,1);
          t.same(d[0].Country,'France');
          t.same(d[0].Aspect,'Economy');
        });
    });

    t.test('nested searches',{autoend:true},function(t) {
      let countries = ['NotCountry0','NotCountry1','NotCountry2','NotCountry3','France','England'];
      var $global = {
        mycountry: Object.setPrototypeOf([1,2,3,4,5,6].map(i => ({
          a: {
            name: countries[i-1],
            num: i
          }
        })), Query),
        input: {
          counter: 5
        }
      };

      return clues(Object.create(data),'where.Country=${mycountry.where.(a.num)=${input.counter}.0.a.name}ΛAspect=Economy', $global)
        .then(function(d) {
          t.same(d.length,1);
          t.same(d[0].Country,'France');
          t.same(d[0].Aspect,'Economy');
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
      return clues(facts,'where.missing',$global)
        .then(function() {
          throw 'SHOULD_ERROR';
        },function(e) {
          t.same(e.message,'INVALID_FILTER');
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
