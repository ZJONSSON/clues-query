var sift = require('sift'),
    clues = require('clues'),
    Promise = clues.Promise;

// Polyfill for Object.setPrototypeOf
Object.setPrototypeOf = Object.setPrototypeOf || function(obj, proto) {
  obj.__proto__ = proto;
  return obj; 
};

function setPrototype(self) {
  return function(d) {
    return Object.setPrototypeOf(d,Object.getPrototypeOf(self));
  };        
}

// WARNING Sift exposes access to javascript through $where
// Here we override $where with an error
sift.useOperator('where',function() { throw '$WHERE_NOT_ALLOWED';});

// Helper functions
function toDots(d) { return d.replace(/ᐉ/g,'.'); }
function noop() {}

// This is the main prototype 
var Query = Object.create(Array.prototype);

// Pick returns a filtered subset of the records
Query.pick = function(_filters) {
  var self = this;
  return function $property(ref) {
  
    // Provide pipe delimited filtering
    ref = ref.split('|').sort();
    if (ref.length > 1)
      // Solve for the first one, and then the remainder
      return [ref[0],function(q) {
        return [{q:q},'q.pick.'+ref.slice(1).join('|'),Object];
      }];
    
    ref = ref[0];

    ref = ref.split('=');

    var filter = {};
    if (ref.length == 2)
      filter[toDots(ref[0])] = ref[1];
    else
      filter = _filters && _filters[ref[0]];

    if (!filter)
      throw {message:'INVALID_FILTER',filter:ref};

    return Object.setPrototypeOf(sift(filter,self),Object.getPrototypeOf(self));
  };
};

Query.select = function($global) {
  var self = this;
  return function $property(ref) {
    ref = ref.split('|').map(toDots);
    return Promise.map(self.slice(),function(d) {
      return Promise.reduce(ref,function(p,field) {
        var key;
        field = field.split('=');
        key = field[1] || field[0];
        field = field[0];
        return clues(d,field,$global)
          .catch(noop)
          .then(function(d) {
            if (ref.length > 1) 
              p[key] = d;
            else
              return d;
            return p;
          });
      },{});
    })
    .then(setPrototype(self));
  };
};

Query.expand = function($global) {
  return Promise.map(this.slice(),function(d) {
    for (var key in d) {
      if (d[key] && (typeof d[key] === 'function' || (d[key].length && typeof d[key][d[key].length-1] === 'function') || d[key].then))
        d[key] = clues(d,key,$global);
    }
    return Promise.props(d);
  })
  .then(setPrototype(this));
};

Query.reversed = function() {
  return setPrototype(this)(this.slice().reverse());
};

Query.ascending = function $property(ref) {
  var self = this;
  var obj = Object.setPrototypeOf(this.slice(),Object.getPrototypeOf(this));
  return [{q:this},'q.select.'+ref,function(keys) {
    obj.forEach(function(d,i) {
      d.sortkey = keys[i];
    });
    obj = obj.sort(function(a,b) {
      return a.sortkey - b.sortkey;
    });
    return setPrototype(self)(obj);
  }];
};

Query.descending = function $property(ref) {
  var self = this;
  return [{q:this},'q.ascending.'+ref,function(ascending) {
    return setPrototype(self)(ascending.slice().reverse());
  }];
};

Query.stats = function() {
  var self = this;

  var stats = this.reduce(function(p,d) {
    p.sum += isNaN(d) ? 0 : d;
    p.cumul.push(p.sum);
    if (!isNaN(d)) {
      p.min = Math.min(p.min,d);
      p.max = Math.max(p.max,d);
    }
    return p;
  },{
    sum : 0,
    cumul : [],
    min : Infinity,
    max : -Infinity
  });
  stats.count = this.length;
  stats.avg = stats.sum / stats.count;
  stats.median = function() {
    var a = self.slice()
      .filter(function(d) {
        return !isNaN(d);
      })
      .sort(function(a,b) { return a-b;}),
        midpoint = Math.floor(a.length/2);
    if (a.length % 2)
      return a[midpoint];
    return (a[midpoint-1]+a[midpoint])/2;
  };

  stats.$property = function(ref) {
    return [{q:self},'q.select.'+ref+'.stats',Object];
  };

  return stats;
};

Query.group_by = function($global,$fullref,$caller,_rank) {
  var self = this;
  return function $property(field) {
    var obj = {};
    return Promise.map(this.slice(),function(d) {
      return clues(d,field,$global,$caller,$fullref)
        .then(function(v) {
          (obj[v] || (obj[v] = setPrototype(self)([]))).push(d);
        });
    })
    .then(function() {
      if (!_rank) 
        return;

      // Reorder into new object
      var o = {};
      [].concat(_rank).forEach(function(key) {
        if (obj[key]) {
          o[key] = obj[key];
          delete obj[key];
        }
      });
      for (var key in obj)
        o[key] = obj[key];
      obj = o;
    })
    .then(function() {
      var groups = Object.keys(obj);
      var $external = function(ref) {
        return Promise.props(groups.reduce(function(p,key) {
          p[key] = clues(obj[key],ref,$global,$caller,$fullref).catch(noop);
          return p;
        },[]));
      };
      Object.defineProperty(obj,'$external',{value:$external});
      return obj;
    });
  };
};

Object.defineProperty(Query,'rank',{
  value : ['input.rank',Object]
});

Object.defineProperty(Query,'filters',{
  value : ['input.filters',Object]
});


module.exports = Query;