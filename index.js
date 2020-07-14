var sift = require('sift'),
    clues = require('clues'),
    pathParser = require('./build/pegjs-parser').parse,
    d3Scale = require('d3-scale'),
    Promise = clues.Promise;

var reSplitter = /[\||Λ]/;

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
function identity(d) { return d; }

// This is the main prototype 
var Query = Object.create(Array.prototype);

function astToCluesPath(node) {
  return astToString(node.paren || node);
}

function astToString(node) {
  if (node.piped) {
    return node.piped.map(n => astToString(n)).join('|');
  }
  if (node.eq) {
    return `${astToString(node.eq.left)}=${astToString(node.eq.right)}`;
  }
  if (node.paren) {
    return `(${astToString(node.paren)})`;
  }
  if (Array.isArray(node)) {
    return node.map(n => astToString(n)).join('.');
  }
  return node;
}

function createExternal(cb) {
  let counter = 0,
      context = {};

  return function $external(path) { 
    let ast = pathParser(path);
    let firstNode = ast[0];
    let firstNodeKey = `_counter${astToString(firstNode)}`;
    let remainder = ast.length > 1 ? '.' + astToString(ast.slice(1)) : '';

    let existingCounter = context[firstNodeKey];
    if (!existingCounter) {
      existingCounter = ++counter;
      context[firstNodeKey] = existingCounter;
      Object.defineProperty(context, `externalKey${existingCounter}`, {value: cb(firstNode), enumerable: true, configurable: true, writable: true});
    }

    return [context, `externalKey${existingCounter}${remainder}`,identity];
  }
}


Query.scale = function(_domain) {
  var self = this;
  return function $property(key) {
    key = key.split(reSplitter);
    var domainKey =  key[1] || _domain;
    var rangeKey = key[0];
    if (!domainKey)
      throw 'NO_DOMAIN';
    
    var d = self.filter(function(d) {
      return !isNaN(d[domainKey]) && !isNaN(d[rangeKey]);
    });

    if (!d.length) 
        throw 'NO_DATA';

    var isDate = (d[0][domainKey].getFullYear && true) || false;

    var scale = d3Scale.scaleLinear()
      .domain(d.map(function(d) {
        return +d[domainKey];
      }))
      .range(d.map(function(d) {
        return +d[rangeKey];
      })); 

    function result(clamp,bound,mult) {
      return Object.create({
        value: function $property(d) {
          d = d.split(reSplitter);
          d = [].concat(d).map(function(d) {
            if (isDate) d = new Date(d);
            if (bound && (+d > scale.domain()[1] || +d < scale.domain()[0]))
              throw 'OUT_OF_BOUNDS';
            return scale.clamp(clamp)(+d) * (mult || 1);
          });
          return d.length == 1 ? d[0] : d;
        },
        change : function $property(d) {
          return [this,'value.'+d,function(d) {
            return (d[1]-d[0]);
          }];
        },
        ratio : function $property(d) {
          return [this,'value.'+d,function(d) {
            return (d[1]-d[0])/d[0];
          }];
        },
        index: function $property(d) {
          d = d.split(reSplitter);
          if (d.length !== 2)
            throw 'index requires y|x';
          return [this,'value.'+d[1],function(e) {
            return result(clamp,bound, +d[0]/e);
          }];
        }
      },{
        $scale: {value: scale}
      });
    }

    var res = result();
    res.clamp = function() {
      return result(true);
    };
    res.bound = function(){
      return result(false,true);
    };
    return res;   
  };
};

Query.$valueFn = function(d) { return d; };

// Pick returns a filtered subset of the records
Query.where = function(_filters, $valueFn) {
  var self = this;
  return function $property(ref) {
  
    // Provide pipe delimited filtering
    ref = ref.split(reSplitter).sort();
    if (ref.length > 1)
      // Solve for the first one, and then the remainder
      return [ref[0],function(q) {
        return [{q:q},'q.where.'+ref.slice(1).join(reSplitter),Object];
      }];
    
    ref = ref[0];

    ref = ref.split('=');

    if (ref[1] === 'true') ref[1] = true;
    if (ref[1] === 'false') ref[1] = false;

    var results;
    if (ref.length == 2)
      results = self.filter(function(d) {
        return $valueFn(d[ref[0]]) == ref[1];
      });
    else
      results = _filters && _filters[ref[0]] && sift(_filters[ref[0]],self);

    if (!results)
      throw {message:'INVALID_FILTER',filter:ref};

    return Object.setPrototypeOf(results,Object.getPrototypeOf(self));
  };
};

Query.where_not = function(_filters, $valueFn) {
  var self = this;
  return function $property(ref) {
  
    // Provide pipe delimited filtering
    ref = ref.split(reSplitter).sort();
    if (ref.length > 1)
      // Solve for the first one, and then the remainder
      return [ref[0],function(q) {
        return [{q:q},'q.where_not.'+ref.slice(1).join(reSplitter),Object];
      }];
    
    ref = ref[0];

    ref = ref.split('=');

    var results;
    if (ref.length == 2)
      results = self.filter(function(d) {
        return $valueFn(d[ref[0]]) != ref[1];
      });
    else
      results = _filters && _filters[ref[0]] && sift({$not:_filters[ref[0]]},self);

    if (!results)
      throw {message:'INVALID_FILTER',filter:ref};

    return Object.setPrototypeOf(results,Object.getPrototypeOf(self));
  };
};

// legacy alias
Query.pick = Query.where;

Query.select = function($global) {
  var self = this;
  return createExternal(ast => {
    let rawPaths = ast.piped ? ast.piped : [ast];
    let directList = rawPaths.length === 1;
    let paths = rawPaths.map(path => {
      if (path.eq) {
        directList = false;
        let p = astToCluesPath(path.eq.left);
        return {
          path: p,
          key: path.eq.right
        }
      }
      let p = astToCluesPath(path);
      return {
        path: p,
        key: p.replace(/[.ᐉᐅ()|Λ=]/g,'_')
      };
    });

    return Promise.map(self.slice(), function(d) {
      return Promise.reduce(paths, function(p, field) {
        return clues(d,field.path,$global)
        .catch(noop)
        .then(function(d) {
          if (!directList) 
            p[field.key] = d;
          else
            return d;
          return p;
        });
      },{});
    })
    .then(setPrototype(self));
  });
};

Query.distinct = function($valueFn, $global) {
  var self = this;
  return createExternal(ast => {
    if (ast.piped) {
      throw 'PIPES_NOT_SUPPORTED';
    }
    let path = astToCluesPath(ast);
    let obj = {};
    return Promise.map(self.slice(), function(d) {
      return clues(d, path, $global)
        .catch(noop)
        .then(d => {
          var key = (typeof d === 'object') ? JSON.stringify(d) : String($valueFn(d));
          if (d !== undefined)
            obj[key] = d;
        });
    })
    .then(() => setPrototype(self)(Object.values(obj)));
  });
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

function createSortFunction(comparator) {
  return function($valueFn, $global) {
    let self = this;
    return createExternal(ast => {
      let obj = Object.setPrototypeOf(self.slice(),Object.getPrototypeOf(self));
      if (ast.piped) {
        throw 'PIPES_NOT_SUPPORTED';
      }
      let path = astToCluesPath(ast);
      return Promise.map(obj, d => {
        return clues(d,path,$global).catch(noop);
      })
      .then(keys => {
        obj.forEach(function(d,i) {
          d.sortkey = $valueFn(keys[i]);
        });
        obj = obj.sort(function(a,b) {
          let aNull = (a.sortkey === null || a.sortkey === undefined);
          let bNull = (b.sortkey === null || b.sortkey === undefined);
          if (aNull || bNull) {
            return (aNull && !bNull) ? 1 : (bNull && !aNull) ? -1 : 0;
          }
          let aVal = Number(a.sortkey);
          if (isNaN(aVal)) aVal = a.sortkey;
          let bVal = Number(b.sortkey);
          if (isNaN(bVal)) bVal = b.sortkey;
          if (typeof aVal !== typeof bVal) {
            aVal = typeof aVal;
            bVal = typeof bVal;
          }
          return comparator(aVal, bVal);
        });
        return setPrototype(self)(obj);
      });
    });
  };
}

Query.ascending = createSortFunction((aVal,bVal) => aVal < bVal ? -1 : aVal > bVal ? 1 : 0)
Query.descending = createSortFunction((aVal,bVal) => aVal < bVal ? 1 : aVal > bVal ? -1 : 0)

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

Query.join = function() {
  if (this.length)
    return this.map(function(d) {
      return d && String(d).trim() || '';
    }).join(' & ');
};

Query.connect = function() {
  if (this.length)
    return this.map(function(d) {
      return d && String(d).trim() || '';
    }).join('');
};

Object.defineProperty(Query,'rank',{
  value : ['input.rank',Object]
});

Object.defineProperty(Query,'filters',{
  value : ['input.filters',Object]
});


module.exports = Query;