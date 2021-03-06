var clues = require('clues'),
    Query = require('../index'),
    data = require('./data');


data = Object.create(data);
data.push({'Country': 'France', 'Aspect': 'French_Fries', 'Value': undefined});
data[2] = Object.create(data[2], { Value: { value: '0' } });
let origData = Object.create(data);

module.exports = t => {

  t.test('ascending',{autoend:true},function(t) {
    t.test('returns a sorted array',{autoend:true},function(t) {
      return clues(data,'ascending.Value')
        .then(function(d) {
          t.ok(Query.isPrototypeOf(d),'result does not have a Query prototype');
          t.same(d.length,32);

          let expectedList = ['0', 41, 55, 56, 69, 71, 72, 76, 77, 78, 79, 81, 81, 82, 82, 86, 87, 87, 87, 92, 92, 95, 96, 100, 100, 100, 100, 100, 100, 100, 'NOT NUMBER', undefined];
          for (let i = 0; i < expectedList.length; i++) {
            t.ok(d[i].Value === expectedList[i], `Values should match: ${d[i].Value} and ${expectedList[i]}`);
          }
          t.same(d[23].Country, 'France');
          t.same(d[24].Country, 'France');
          t.same(d[23].Aspect, 'Freedom');
          t.same(d[24].Aspect, 'Health');
        });
    });

    t.test('flat array',{autoend:true},function(t) {
      return clues(Object.setPrototypeOf([1,2,5,1,6,5], Query),'ascending.$root')
        .then(function(d) {
          t.ok(Query.isPrototypeOf(d),'result does not have a Query prototype');
          t.same(d,[1,1,2,5,5,6]);
        });
    });
  
    t.test('flat array',{autoend:true},function(t) {
      return clues(Object.setPrototypeOf([1,2,5,1,6,5], Query),'descending.$root')
        .then(function(d) {
          t.ok(Query.isPrototypeOf(d),'result does not have a Query prototype');
          t.same(d,[6,5,5,2,1,1]);
        });
    });
  
    
    t.test('works deep - returns a sorted array',{autoend:true},function(t) {
      return clues(Object.setPrototypeOf(origData.map(d => ({a:()=>({b:d})})), Query),'ascending.(a.b.Value)')
        .then(function(d) {
          t.ok(Query.isPrototypeOf(d),'result does not have a Query prototype');
          t.same(d.length,32);

          let expectedList = ['0', 41, 55, 56, 69, 71, 72, 76, 77, 78, 79, 81, 81, 82, 82, 86, 87, 87, 87, 92, 92, 95, 96, 100, 100, 100, 100, 100, 100, 100, 'NOT NUMBER', undefined];
          for (let i = 0; i < expectedList.length; i++) {
            t.ok(d[i].a.b.Value === expectedList[i], `Values should match: ${d[i].Value} and ${expectedList[i]}`);
          }
        });
    });

    t.test('doesnt break if all undefined',{autoend:true}, function(t) {
      var data = Object.setPrototypeOf([
        {'Country': 'France', 'Aspect': 'French_Fries', 'Value': undefined},
        {'Country': 'Spain', 'Aspect': 'Spench_Fries', 'Value': undefined},
        {'Country': 'England', 'Aspect': 'English_Fries', 'Value': null}], Query);
      return clues(data,'ascending.Value')
        .then(function(d) {
          t.ok(Query.isPrototypeOf(d),'result does not have a Query prototype');
          t.same(d.length,3);

          let expectedList = [undefined, undefined, null];
          for (let i = 0; i < expectedList.length; i++) {
            t.ok(d[i].Value === expectedList[i], `Values should match: ${d[i].Value} and ${expectedList[i]}`);
          }
        });
    });

  });

  t.test('descending',{autoend:true},function(t) {
    t.test('returns a sorted array',{autoend:true},function(t) {
      return clues(data,'descending.Value')
        .then(function(d) {
          t.ok(Query.isPrototypeOf(d),'result does not have a Query prototype');
          t.same(d.length,32);


          let expectedList = ['NOT NUMBER', 100, 100, 100, 100, 100, 100, 100, 96, 95, 92, 92, 87, 87, 87, 86, 82, 82, 81, 81, 79, 78, 77, 76, 72, 71, 69, 56, 55, 41, '0', undefined];
          for (let i = 0; i < expectedList.length; i++) {
            t.ok(d[i].Value === expectedList[i], `Values should match: ${d[i].Value} and ${expectedList[i]}`);
          }
          t.same(d[6].Country, 'France');
          t.same(d[7].Country, 'France');
          t.same(d[6].Aspect, 'Health');
          t.same(d[7].Aspect, 'Freedom');
        });
    });

    t.test('doesnt break if all undefined',{autoend:true}, function(t) {
      var data = Object.setPrototypeOf([
        {'Country': 'France', 'Aspect': 'French_Fries', 'Value': undefined},
        {'Country': 'Spain', 'Aspect': 'Spench_Fries', 'Value': undefined},
        {'Country': 'England', 'Aspect': 'English_Fries', 'Value': null}], Query);
      return clues(data,'ascending.Value')
        .then(function(d) {
          t.ok(Query.isPrototypeOf(d),'result does not have a Query prototype');
          t.same(d.length,3);

          let expectedList = [undefined, undefined, null];
          for (let i = 0; i < expectedList.length; i++) {
            t.ok(d[i].Value === expectedList[i], `Values should match: ${d[i].Value} and ${expectedList[i]}`);
          }
        });
    });

  });
};

if (!module.parent) module.exports(require('tap'));