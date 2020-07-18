var clues = require('clues'),
    Query = require('../index'),
    
    data = require('./data');

data = Object.create(data);


// Create nested promises for flattening
data.forEach(function(d,i) {
  data[i] = d = Object.create(d);
  d.test = function() {
    return {
      a : clues.Promise.delay(100)
        .then(function() {
          var obj = {};
          obj.b = i+8;
          obj.c = Object.setPrototypeOf([...new Array(10)].map(d => ({deep1:{deep2:i+2}})), Query);
          return obj;
        })
    };
  };
});

module.exports = t => {

t.test('select',{autoend:true},function(t) {
  t.test('simple',{autoend:true},function(t) {
    t.test('returns an array of numbers',{autoend:true},function(t) {
      return clues(data,'select.Value')
        .then(function(d) {
          t.ok(Query.isPrototypeOf(d),'result does not have a Query prototype');
          t.same(d.length,31);
          t.same(2503,d.reduce(function(p,d) {
            if (isNaN(d)) return p;
            return p+(d || 0);
          },0));
        });
    });
    t.test('returns array of objects',{autoend:true},function(t) {
      return clues(data,'select.Value=val|')
        .then(function(d) {
          t.ok(Query.isPrototypeOf(d),'result does not have a Query prototype');
          t.same(d.length,31);
          t.same(2503,d.reduce(function(p,d) {
            if (isNaN(d.val)) return p;
            return p+(d.val || 0);
          },0));          
        });
    });
  });
  t.test('joint',{autoend:true},function(t) {
    t.test('flattens object 1',{autoend:true},function(t) {
      return clues(data,'select.Value=val|testᐉaᐉb=no')
        .then(function(d) {
          t.ok(Query.isPrototypeOf(d),'result does not have a Query prototype');
          t.same(d.length,31);
          d.forEach(function(d,i) {
            t.same(d.no,i+8);
            t.same(d.val,data[i].Value);
          });
        });
    });
    t.test('flattens object 2',{autoend:true},function(t) {
      return clues(data,'select.Value=val|testᐉaᐉb')
        .then(function(d) {
          t.ok(Query.isPrototypeOf(d),'result does not have a Query prototype');
          t.same(d.length,31);
          d.forEach(function(d,i) {
            t.same(d['test.a.b'],i+8);
            t.same(d.val,data[i].Value);
          });
        });
    });

    t.test('flattens object with Λ instead of |',{autoend:true},function(t) {
      return clues(data,'select.Value=valΛtestᐉaᐉb=no')
        .then(function(d) {
          t.ok(Query.isPrototypeOf(d),'result does not have a Query prototype');
          t.same(d.length,31);
          d.forEach(function(d,i) {
            t.same(d.no,i+8);
            t.same(d.val,data[i].Value);
          });
        });
    });


    t.test('can go deeper than an object',{autoend:true},function(t) {
      return clues(data,'select.Value=valcΛtestᐉaᐉb=no.1.no')
        .then(function(d) {
          t.same(d,9);
        });
    });

    t.test('parens work',{autoend:true},function(t) {
      return clues(data,'select.Value=valbΛ(test.a.c.select.(deep1.deep2))=no.5')
        .then(function(d) {
          t.same(d.no.length,10);
          t.same(d.no[1],7);
        });
    });

    t.test('can do operations',{autoend:true},function(t) {
      return clues(data,'select.add(Value,5)')
        .then(function(d) {
          t.same(d.length,data.length);
          d.forEach(function(d,i) {
            t.same(d,data[i].Value+5);
          });
        });
    });

    t.test('can do aliased operations',{autoend:true},function(t) {
      return clues(data,'select.add(Value,3)=no')
        .then(function(d) {
          t.same(d.length,data.length);
          d.forEach(function(d,i) {
            t.same(d.no,data[i].Value+3);
          });
        });
    });

    t.test('can do multiple aliased operations',{autoend:true},function(t) {
      return clues(data,'select.add(Value,3)=no|Value')
        .then(function(d) {
          t.same(d.length,data.length);
          d.forEach(function(d,i) {
            t.same(d.no,data[i].Value+3);
            t.same(d.Value,data[i].Value);
          });
        });
    });

    t.test('can do multiple aliased operations',{autoend:true},function(t) {
      return clues(data,'select.add(Value,3)=no|sub(Value,5)=smaller')
        .then(function(d) {
          t.same(d.length,data.length);
          d.forEach(function(d,i) {
            t.same(d.no,data[i].Value+3);
            t.same(d.smaller,data[i].Value-5);
          });
        });
    });

    t.test('can do multiple unaliased operations',{autoend:true},function(t) {
      return clues(data,'select.add(Value,3)|sub(Value,5)')
        .then(function(d) {
          t.same(d.length,data.length);
          d.forEach(function(d,i) {
            t.same(d['add(Value|3)'],data[i].Value+3);
            t.same(d['sub(Value|5)'],data[i].Value-5);
          });
        });
    });


    t.test('can do if',{autoend:true},function(t) {
      return clues(data,'select.if(Value<100,"bad","good")')
        .then(function(d) {
          t.same(d.length,data.length);
          d.forEach(function(d,i) {
            t.same(d, data[i].Value < 100 ? 'bad' : 'good');
          });
        });
    });
  });
});

};

if (!module.parent) module.exports(require('tap'));