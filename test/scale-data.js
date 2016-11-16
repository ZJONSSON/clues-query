var Query = require('../index');

var data = [
  {x:0, y:70, x2: 50, x3 : new Date(2001,1,1), nested: {value: {score: 8}}},
  {x:50, y:30},
  {x:100, y:10, x2: 40, x3: new Date(2010,1,1), nested: {value: {score: 11}}}
];

module.exports = Object.setPrototypeOf(data,Query);