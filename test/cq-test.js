var clues = require('clues'),
    Query = require('../index')
module.exports = t => {
  var testArray = [{a:5,b:{c:6},subarr:[1,2,3],deeper:{subarr2:[4,5,6]}}];

  t.test('simple cq',{autoend:true},function(t) {
    return clues(Object.setPrototypeOf(testArray.slice(), Query), 'cq.a').then(result => {
      t.ok(Query.isPrototypeOf(result),'result does not have a Query prototype');
      t.same(result[0], 5);
    });
  });

  t.test('simple cq',{autoend:true},function(t) {
    return clues(Object.setPrototypeOf(testArray.slice(), Query), 'cq.a|b').then(result => {
      t.ok(Query.isPrototypeOf(result),'result does not have a Query prototype');
      t.same(result[0].a, 5);
      t.same(JSON.stringify(result[0].b), `{"c":6}`);
    });
  });

  t.test('clues-querifies sub objects',{autoend:true},function(t) {
    return clues(Object.setPrototypeOf(testArray.slice(), Query), 'cq.subarr').then(result => {
      t.ok(Query.isPrototypeOf(result),'result does not have a Query prototype');
      t.same(result.length, 3);
      return clues(result, 'stats.sum').then(sum => t.same(sum, 6));
    });
  });

  t.test('clues-querifies sub objects via parens',{autoend:true},function(t) {
    return clues(Object.setPrototypeOf(testArray.slice(), Query), 'cq.(deeper.subarr2).stats.sum').then(result => {
      t.same(result, 15);
    });
  });

  t.test('clues-querifies sub objects via parens',{autoend:true},function(t) {
    return clues(Object.setPrototypeOf(testArray.slice(), Query), 'cq.add((cq(deeper.subarr2).stats.sum),5)').then(result => {
      t.ok(Query.isPrototypeOf(result),'result does not have a Query prototype');
      t.same(result[0], 20);
    });
  });

  t.test('can do math on stuff',{autoend:true},function(t) {
    return clues(Object.setPrototypeOf(testArray.slice(), Query), 'cq.add(a,(b.c))').then(result => {
      t.ok(Query.isPrototypeOf(result),'result does not have a Query prototype');
      t.same(result[0], 11);
    });
  });

};

if (!module.parent) module.exports(require('tap'));