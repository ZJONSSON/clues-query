var clues = require('clues'),
    Query = require('../index'),
    assert = require('assert'),
    data = require('./data');

data = Object.create(data);

var byAspect = data.reduce(function(p,d) {
  p[d.Aspect] = (p[d.Aspect] || []).concat(d);
  return p;
},{});

describe('group_by',function() {

  it('groups data',function() {
    return clues(Object.create(data),'group_by.Aspect')
      .then(function(d) {
        assert(Object.getPrototypeOf(d.Cost_of_Living) === Query,'result is not Query prototype');
        for (var key in byAspect)
          assert.deepEqual(byAspect[key],d[key]);       
      });
  });

  it('allows secondary groups',function(){
    return clues(Object.create(data),'group_by.Aspect.group_by.Country')
      .then(function(d) {
        assert(Object.getPrototypeOf(d.Cost_of_Living.France) === Query,'result is not Query');
        assert.equal(d.Cost_of_Living.France[0].Value,55);
      });
  });

  it('follows rank order when provided',function() {
    return clues(Object.create(data),'group_by.Aspect',{input:{rank:['Economy','Health']}})
      .then(function(d) {
           assert(Object.getPrototypeOf(d.Economy) === Query,'result is not Query prototype');
        var keys = Object.keys(d);
        assert.equal(keys[0],'Economy');
        assert.equal(keys[1],'Health');
      });
  });


});

