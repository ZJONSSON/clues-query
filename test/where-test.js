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

     t.test('add',{autoend:true},function(t) {
      return clues(facts,'where.Value<add(10|90)')
        .then(function(d) {
          t.same(d.length,23);
          for (var i = 1; i < 23; i++) {
            t.ok(d[i].Value<100,'Less than 100');
          }
        });
     });

     t.test('add on left',{autoend:true},function(t) {
      return clues(facts,'where.add(10|Value)<110')
        .then(function(d) {
          t.same(d.length,23);
          for (var i = 1; i < 23; i++) {
            t.ok(d[i].Value<100,'Less than 100');
          }
        });
     });

     t.test('divide and add',{autoend:true},function(t) {
      return clues(facts,'where.div(add(10|Value)|100)<"1.10"')
        .then(function(d) {
          t.same(d.length,23);
          for (var i = 1; i < 23; i++) {
            t.ok(d[i].Value<100,'Less than 100');
          }
        });
     });

     t.test('multiply and add',{autoend:true},function(t) {
      return clues(facts,'where.mul(add(10,Value),100)<11000')
        .then(function(d) {
          t.same(d.length,23);
          for (var i = 1; i < 23; i++) {
            t.ok(d[i].Value<100,'Less than 100');
          }
        });
     });

     t.test('sub with secondary value',{autoend:true},function(t) {
      return clues(facts,'where.sub(Value,(secondary.value))=50')
        .then(function(d) {
          t.same(d.length,1);
          t.ok(d[0].Value==100,'100');
        });
     });

     t.test('if',{autoend:true},function(t) {
      return clues(facts,'where.if(Aspect=Freedom,50,Value)<100')
        .then(function(d) {
          t.same(d.length,26);
          for (var i = 1; i < 26; i++) {
            let isOkay = d[i].Value < 100;
            if (d[i].Aspect === 'Freedom') {
              isOkay = true;
            }
            t.ok(isOkay,'Less than 100');
          }
        });
     });

     t.test('if on right',{autoend:true},function(t) {
      return clues(facts,'where.100>if((Aspect=Freedom),50|Value)')
        .then(function(d) {
          t.same(d.length,26);
          for (var i = 1; i < 26; i++) {
            let isOkay = d[i].Value < 100;
            if (d[i].Aspect === 'Freedom') {
              isOkay = true;
            }
            t.ok(isOkay,'Less than 100');
          }
        });
     });
     
     t.test('< with values from global',{autoend:true},function(t) {
      var $global = {
        input: {
          counter: 50
        }
      };

      // this relies on there being different `input` from global - and the $external on where
      // will memoize the first $global it sees....
      return clues(Object.create(data),'where.sub(Value|${global_input.counter})<add(10|40)',$global)
        .then(function(d) {
          t.same(d.length,23);
          for (var i = 1; i < 23; i++) {
            t.ok(d[i].Value<100,'Less than 100');
          }
        });
     });


     t.test('cannot reference everythign in global',{autoend:true},function(t) {
      var $global = {
        somethingelse: {
          counter: 50
        }
      };

      // this relies on there being different `input` from global - and the $external on where
      // will memoize the first $global it sees....
      return clues(Object.create(data),'where.sub(Value|${somethingelse.counter})<add(10|40)',$global)
        .then(function(d) {
          t.same(d.length,0);
        });
     });

     t.test('cannot reference something $private',{autoend:true},function(t) {
      let obj = Object.create(data);
      obj.something = function $private() { return 50; }
      return clues(obj,'where.sub(Value|${something})<add(10|40)')
       .then(function(d) {
         t.same(d.length,0);
       });
    });

    t.test('can reference something not $private',{autoend:true},function(t) {
      let obj = Object.create(data);
      obj.something = function() { return 50; }
      return clues(obj,'where.sub(Value|${something})<add(10|40)')
       .then(function(d) {
         t.same(d.length,23);
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


    let f2 = Object.setPrototypeOf([
      { a: [1,2,3], b: 'test1', c: ["a","b","C"], itemTarget: 'C' },
      { a: [1,2,4], b: 'test2', c: ["a","b","d"], itemTarget: 'C' },
      { a: [3], b: 'test3', c: ["C"], itemTarget: 'B' },
      { nothing: true, itemTarget: "D" },
   ], Query);

   t.test("basic in",{autoend:true},function(t) {
    return clues(f2,'where.in(3, a)')
      .then(function(d) {
        t.same(d.length,2);
        t.same(d[0].b, 'test1');
        t.same(d[1].b, 'test3');
      });
   });
   t.test("basic in strings",{autoend:true},function(t) {
    return clues(f2,'where.in(C, c)')
      .then(function(d) {
        t.same(d.length,2);
        t.same(d[0].b, 'test1');
        t.same(d[1].b, 'test3');
      });
   });
   t.test("basic in with not arrays",{autoend:true},function(t) {
    return clues(f2,'where.in((b), "test2")')
      .then(function(d) {
        t.same(d.length,1);
        t.same(d[0].b, 'test2');
    });
   });
   t.test("basic in with not arrays2",{autoend:true},function(t) {
    return clues(f2,'where.in("TEST", (b))')
      .then(function(d) {
        t.same(d.length,3);
    });
   });
   t.test("basic in with not arrays not matching",{autoend:true},function(t) {
    return clues(f2,'where.in((b), "test99")')
      .then(function(d) {
        t.same(d.length,0);
    });
   });
   t.test("basic in target from item",{autoend:true},function(t) {
    return clues(f2,'where.in((itemTarget), c)')
      .then(function(d) {
        t.same(d.length,1);
      });
   });
   t.test("basic in target from item",{autoend:true},function(t) {
    return clues(f2,'where.in((itemTarget), arr("B", "C"))')
      .then(function(d) {
        t.same(d.length,3);
      });
   });
   t.test("basic in target from item",{autoend:true},function(t) {
    return clues(f2,'where.in(test2, arr(b, "C"))')
      .then(function(d) {
        t.same(d.length,1);
      });
   });


     t.test("nested string quoted",{autoend:true},function(t) {
      return clues(facts,'where.and(Value<90|complex="This is a... really complicated \\"thing\\"!")')
        .then(function(d) {
          t.same(d.length,1);
          t.same(d[0].complex, 'This is a... really complicated "thing"!');
        });
     });

     t.test('nested where', {autoend:true}, function(t) {
      return clues(facts,'where.if((secondary.value)>25,5,0)')
        .then(function(d) {
          t.same(d.length,1);
          t.same(d[0].Aspect, 'Risk_&_Safety');
        });
     });

     t.test('works in more than one dimension with Λ as splitter and value from global',{autoend:true},function(t) {
      var $global = {
        app: {
          mycountry: {
            is: 'France'
          }
        }
      };
      return clues(Object.create(data),'where.Country=${global_app.mycountry.is}ΛAspect=Economy', $global)
        .then(function(d) {
          t.same(d.length,1);
          t.same(d[0].Country,'France');
          t.same(d[0].Aspect,'Economy');
        });
    });

    t.test('nested searches',{autoend:true},function(t) {
      let countries = ['NotCountry0','NotCountry1','NotCountry2','NotCountry3','France','England'];
      var $global = {
        app: {
          mycountry: Object.setPrototypeOf([1,2,3,4,5,6].map(i => ({
            a: {
              name: countries[i-1],
              num: i
            }
          })), Query)
        },
        input: {
          counter: 5
        }
      };

      return clues(Object.create(data),'where.Country=${global_app.mycountry.where.(a.num)=${global_input.counter}.0.a.name}ΛAspect=Economy', $global)
        .then(function(d) {
          t.same(d.length,1);
          t.same(d[0].Country,'France');
          t.same(d[0].Aspect,'Economy');
        });
    });


    t.test('using fuzzy',{autoend:true},function(t) {
      return clues(data,'where.fuzzy((Aspect), "living")>30.distinct.Aspect')
          .then(function(d) {
            t.same([ 'Cost_of_Living', 'Environment', 'Climate', 'Final' ], d);
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
