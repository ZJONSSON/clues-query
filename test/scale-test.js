/* jshint mocha:true */

var clues = require('clues'),
    Query = require('../index'),
    assert = require('assert'),
    Data = require('./scale-data');

var data = Object.create(Data);

describe('scale',function() {
  describe('default',function() {
    it('interpolates a single value',function() {
      return clues(data,'scale.y|x.value.75')
        .then(function(d) {
          assert.equal(d,20);       
        });
    });

    it('interpolates multiple values',function() {
      return clues(data,'scale.y|x.value.50|75|100')
        .then(function(d) {
          assert.deepEqual(d,[30,20,10]);       
        });
    });

    it('calculates change',function() {
      return clues(data,'scale.y|x.change.75|100')
        .then(function(d) {
          assert.equal(d,-10);
        });
    });

    it('calculates ratio',function() {
      return clues(data,'scale.y|x.ratio.75|100')
        .then(function(d) {
          assert.equal(d,-0.5);
        });
    });

    it('extrapolates by default',function() {
      return clues(data,'scale.y|x.value.-25|150')
        .then(function(d) {
          assert.deepEqual(d,[90,-10]);       
        });
    });

    it('missing domain key is not included',function() {
      return clues(data,'scale.y|x2.value.50')
        .then(function(d) {
          assert.equal(d,70);
        });
    });
  });

  describe('default domain',function() {
    var data2 = Object.create(Data);
    data2.domain = 'x';

    it('errors when not specified',function() {
      return clues(data,'scale.y.value.50')
        .then(function() {
          throw 'SHOULD_ERROR';
        },function(e) {
          assert.equal(e.message,'NO_DOMAIN');
        });
    });

    it('works when specified',function() {
      return clues(data2,'scale.y.value.45')
        .then(function(d) {
          assert.equal(d,34);
        });
    });

    it('request can override',function() {
      return clues(data2,'scale.y|x2.value.45')
        .then(function(d) {
          assert.equal(d,40);
        });
    });
  });

  describe('clamped',function() {
    it('interpolates',function() {
      return clues(data,'scale.y|x.clamp.value.25|75')
        .then(function(d) {
          assert.deepEqual(d,[50,20]);       
        });
    });

    it('does not extrapolate',function() {
      return clues(data,'scale.y|x.clamp.value.-25|150')
        .then(function(d) {
          assert.deepEqual(d,[70,10]);       
        });
    });
  });

  describe('bound',function() {
    it('interpolates',function() {
      return clues(data,'scale.y|x.clamp.value.25|75')
        .then(function(d) {
          assert.deepEqual(d,[50,20]);       
        });
    });

    it('bound throws error if out of bounds',function() {
      return clues(data,'scale.y|x.bound.value.125')
        .then(function(d) {
          throw 'Should Error';      
        },function(e) {
          assert.equal(e.message,'OUT_OF_BOUNDS');
        });
    });
  });

  describe('index',function() {
    it('rescales',function() {
      return clues(data,'scale.y|x.index.100|50.value.50|100')
        .then(function(d) {
          assert.deepEqual(d,[100,100/3]);
        });
    });
  });

  describe('date domain',function() {
    it('interpolates',function() {
      return clues(data,'scale.x|x3.value.01-01-2005')
        .then(function(d) {
          assert.equal(Math.floor(d*1000),43504);
        });
    });
  });
});



  