var clues = require('clues'),
    Query = require('../index'),
    
    data = require('./data');

data = Object.create(data);


// Create nested promises for flattening
data.forEach(function(d,i) {
  data[i] = {
    Country : clues.Promise.resolve(d.Country),
    Value : function() {
      return clues.Promise.resolve(d.Value);
    },
    Aspect : [data[i],function() {
      return d.Aspect;
    }],
    AspectOrCountry : (Country, Aspect) => {
      if (Country === 'Australia') {
        return {deep:Country};
      }
      if (Aspect === 'Climate') {
        throw 'NO';
      }
      return {deep:Aspect};
    }
  };
 
});

module.exports = t => {

t.test('distinct',{autoend:true},function(t) {
  t.test('resolves function/promises across array',{autoend:true},function(t) {
    return clues(data,'distinct.Country')
      .then(function(d) {
        t.ok(Query.isPrototypeOf(d),'result does not have a Query prototype');
        t.same(d,['France','Australia','Switzerland']);
      });
  });
  t.test('nested resolves function/promises across array',{autoend:true},function(t) {
    return clues(Object.setPrototypeOf(data.map(d => ({a:()=>({b:d})})), Query),'distinct.(a.b.Country)')
      .then(function(d) {
        t.ok(Query.isPrototypeOf(d),'result does not have a Query prototype');
        t.same(d,['France','Australia','Switzerland']);
      });
  });
  t.test('flat array',{autoend:true},function(t) {
    return clues(Object.setPrototypeOf([1,2,5,1,6,5], Query),'distinct.$root')
      .then(function(d) {
        t.ok(Query.isPrototypeOf(d),'result does not have a Query prototype');
        t.same(d,[1,2,5,6]);
      });
  });

  t.test('flat array works for more complex objects 1',{autoend:true},function(t) {
    return clues(Object.setPrototypeOf([1,2,5,[1,2],6,5,[1,2]], Query),'distinct.$root')
      .then(function(d) {
        t.ok(Query.isPrototypeOf(d),'result does not have a Query prototype');
        d.sort();
        t.same(d,[1,[1,2],2,5,6]);
      });
  });

  t.test('resolves multiple function/promises across array',{autoend:true},function(t) {
    return clues(data,'distinct.Country,(AspectOrCountry.deep)')
      .then(function(d) {
        t.ok(Query.isPrototypeOf(d),'result does not have a Query prototype');
        let expected = ['France',
          'Australia',
          'Switzerland',
          'Cost_of_Living',
          'Undefined',
          'Leisure_&_Culture',
          'Economy',
          'Environment',
          'Freedom',
          'Health',
          'Infrastructure',
          'Risk_&_Safety',
          'Final'];
        t.same(d,expected);
      });
  });
  
});

};

if (!module.parent) module.exports(require('tap'));