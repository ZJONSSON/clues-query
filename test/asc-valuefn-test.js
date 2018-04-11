var clues = require('clues'),
    Query = require('../index'),
    assert = require('assert'),
    data = require('./data');

data = Object.create(data);
data.$valueFn = function(s) {
  console.log(s, typeof s);
  if (typeof s === 'string') return s;
  if (s === undefined) return s;
  return 200 - s;
};

data.push({'Country': 'France', 'Aspect': 'French_Fries', 'Value': undefined});
data[2] = Object.create(data[2], { Value: { value: '0' } });

describe('ascending',function() {
  it('returns a sorted array',function() {
    return clues(data,'ascending.Value')
      .then(function(d) {
        assert(Query.isPrototypeOf(d),'result does not have a Query prototype');
        assert.equal(d.length,32);

        let expectedList = ['0', 100, 100, 100, 100, 100, 100, 100, 96, 95, 92, 92, 87, 87, 87, 86, 82, 82, 81, 81, 79, 78, 77, 76, 72, 71, 69, 56, 55, 41, 'NOT NUMBER', undefined];
        for (let i = 0; i < expectedList.length; i++) {
          assert(d[i].Value === expectedList[i], `Values should match ${i}: ${d[i].Value} and ${expectedList[i]}`);
        }
      });
  });
});

describe('descending',function() {
  it('returns a sorted array',function() {
    return clues(data,'descending.Value')
      .then(function(d) {
        assert(Query.isPrototypeOf(d),'result does not have a Query prototype');
        assert.equal(d.length,32);


        let expectedList = ['NOT NUMBER', 41, 55, 56, 69, 71, 72, 76, 77, 78, 79, 81, 81, 82, 82, 86, 87, 87, 87, 92, 92, 95, 96, 100, 100, 100, 100, 100, 100, 100, '0', undefined];
        for (let i = 0; i < expectedList.length; i++) {
          assert(d[i].Value === expectedList[i], `Values should match: ${d[i].Value} and ${expectedList[i]}`);
        }
      });
  });

  it('doesnt break if all undefined', function() {
    data = Object.setPrototypeOf([
      {'Country': 'France', 'Aspect': 'French_Fries', 'Value': undefined},
      {'Country': 'Spain', 'Aspect': 'Spench_Fries', 'Value': undefined},
      {'Country': 'England', 'Aspect': 'English_Fries', 'Value': null}], Query);
    return clues(data,'descending.Value')
      .then(function(d) {
        assert(Query.isPrototypeOf(d),'result does not have a Query prototype');
        assert.equal(d.length,3);


        let expectedList = [null, undefined, undefined];
        for (let i = 0; i < expectedList.length; i++) {
          assert(d[i].Value === expectedList[i], `Values should match: ${d[i].Value} and ${expectedList[i]}`);
        }
      });
  });
});

