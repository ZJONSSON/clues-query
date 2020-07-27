var clues = require('clues'),
    Query = require('../index'),
    Promise = clues.Promise;

const data = Object.setPrototypeOf([
  { a:5, b: [2,3] },
  6,
  Promise.resolve([5,6]),
  { c: null, b: ()=> Promise.reject('foop'), a: Promise.reject('wtf'), d: Promise.resolve(undefined), e: Promise.resolve(8) },
  null,
  "some string",
  undefined,
  false,
  0
], Query);

module.exports = t => {

t.test('flat test',{autoend:true},function(t) {
  return clues(data,'flat')
    .then(function(d) {
      t.same(d, [ 5, 2, 3, 6, 5, 6, 8, 'some string', false, 0 ], 'confirm matches');
    });
});
          
};

if (!module.parent) module.exports(require('tap'));