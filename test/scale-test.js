/* jshint mocha:true */

var clues = require('clues'),
    Query = require('../index'),
    
    Data = require('./scale-data');

var data = Object.create(Data);

module.exports = t => {

t.test('scale',{autoend:true},function(t) {
  t.test('default',{autoend:true},function(t) {
    t.test('interpolates a single value',{autoend:true},function(t) {
      return clues(data,'scale.y|x.value.75')
        .then(function(d) {
          t.same(d,20);       
        });
    });

    t.test('interpolates multiple values',{autoend:true},function(t) {
      return clues(data,'scale.yΛx.value.50Λ75Λ100')
        .then(function(d) {
          t.same(d,[30,20,10]);       
        });
    });

    t.test('calculates change',{autoend:true},function(t) {
      return clues(data,'scale.y|x.change.75|100')
        .then(function(d) {
          t.same(d,-10);
        });
    });

    t.test('calculates ratio',{autoend:true},function(t) {
      return clues(data,'scale.y|x.ratio.75|100')
        .then(function(d) {
          t.same(d,-0.5);
        });
    });

    t.test('extrapolates by default',{autoend:true},function(t) {
      return clues(data,'scale.y|x.value.-25|150')
        .then(function(d) {
          t.same(d,[90,-10]);       
        });
    });

    t.test('deeper data - extrapolates by default',{autoend:true},function(t) {
      return clues(Object.setPrototypeOf(data.map(d => ({a:{b:d}})), Query),'scale.(a.b.y)|(a.b.x).value.-25|150')
        .then(function(d) {
          t.same(d,[90,-10]);       
        });
    });

    t.test('missing domain key is not included',{autoend:true},function(t) {
      return clues(data,'scale.y|x2.value.50')
        .then(function(d) {
          t.same(d,70);
        });
    });
  });

  t.test('default domain',{autoend:true},function(t) {
    var data2 = Object.create(Data);
    data2.domain = 'x';

    t.test('errors when not specified',{autoend:true},function(t) {
      return clues(data,'scale.y.value.50')
        .then(function() {
          throw 'SHOULD_ERROR';
        },function(e) {
          t.same(e.message,'NO_DOMAIN');
        });
    });

    t.test('works when specified',{autoend:true},function(t) {
      return clues(data2,'scale.y.value.45')
        .then(function(d) {
          t.same(d,34);
        });
    });

    t.test('works with fractions',{autoend:true},function(t) {
      return clues(data2,'scale.y.value.(45.5)')
        .then(function(d) {
          t.same(d,33.6);
        });
    });

    t.test('request can override',{autoend:true},function(t) {
      return clues(data2,'scale.y|x2.value.45')
        .then(function(d) {
          t.same(d,40);
        });
    });
  });

  t.test('clamped',{autoend:true},function(t) {
    t.test('interpolates',{autoend:true},function(t) {
      return clues(data,'scale.y|x.clamp.value.25|75')
        .then(function(d) {
          t.same(d,[50,20]);       
        });
    });

    t.test('does not extrapolate',{autoend:true},function(t) {
      return clues(data,'scale.y|x.clamp.value.-25|150')
        .then(function(d) {
          t.same(d,[70,10]);       
        });
    });
  });

  t.test('bound',{autoend:true},function(t) {
    t.test('interpolates',{autoend:true},function(t) {
      return clues(data,'scale.y|x.clamp.value.25|75')
        .then(function(d) {
          t.same(d,[50,20]);       
        });
    });

    t.test('bound throws error if out of bounds',{autoend:true},function(t) {
      return clues(data,'scale.y|x.bound.value.125')
        .then(function(d) {
          throw 'Should Error';      
        },function(e) {
          t.same(e.message,'OUT_OF_BOUNDS');
        });
    });
  });

  t.test('index',{autoend:true},function(t) {
    t.test('rescales',{autoend:true},function(t) {
      return clues(data,'scale.y|x.index.100|50.value.50|100')
        .then(function(d) {
          t.same(d,[100,100/3]);
        });
    });
  });

  t.test('can get service method', {autoend:true}, function(t) {
    var data2 = Object.create(Data);
    data2.domain = 'x';
    return clues(data2,'scale.y|x2.$scale')
      .then(function(d) {
        t.same(d(45), 40);
      });
  });

  t.test('date domain',{autoend:true},function(t) {
    t.test('interpolates',{autoend:true},function(t) {
      return clues(data,'scale.x|x3.value.01-01-2005')
        .then(function(d) {
          t.same(Math.floor(d*1000),43504);
        });
    });
  });
});
  
};

if (!module.parent) module.exports(require('tap'));