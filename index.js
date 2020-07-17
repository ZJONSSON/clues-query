var clues = require('clues'),
    { pathParser, astToCluesPath, astToString } = require('./ast'),
    d3Scale = require('d3-scale'),
    Promise = clues.Promise,
    generateEvaluateConditionFn = require('./conditional');

function setPrototype(self) {
  return function(d) {
    return Object.setPrototypeOf(d,Object.getPrototypeOf(self));
  };        
}
 
// Helper functions
function noop() {}
function inverseIdentity(d) { return !d; }
function identity(d) { return d; }
function servicifyResult(maybeFn) {
  // when boxed in an "external", we can't return a function or it'll try to solve it.  So if we get an $external back, 
  // we have to make sure clues doesn't do its thing and properly mark it as a service method
  if (typeof maybeFn === 'function' && maybeFn.name !== '$service') {
    Object.defineProperty(maybeFn, 'name', { value: '$service'});
  }
  return maybeFn;
}

// This is the main prototype 
var Query = Object.create(Array.prototype);

function createExternal(cb) {
  let counter = 0,
      context = {};

  return function $external(path) { 
    let ast = pathParser(path);
    let firstNode = ast.root;
    let firstNodeKey = `_counter${astToString(firstNode)}`;
    let remainder = ast.extra ? `.${ast.extra}` : '';

    let existingCounter = context[firstNodeKey];
    if (!existingCounter) {
      existingCounter = ++counter;
      context[firstNodeKey] = existingCounter;
      Object.defineProperty(context, `externalKey${existingCounter}`, {value: cb(firstNode), enumerable: true, configurable: true, writable: true});
    }

    return [context, `externalKey${existingCounter}${remainder}`, servicifyResult];
  };
}

Query.scale = function(_domain, $global) {
  var self = this;

  return createExternal(async ast => {
    let pipePieces = ast.piped ? ast.piped : [ast];
    if (pipePieces.length >= 3) {
      throw 'MAXIMUM_OF_TWO_INPUTS';
    }
    let rangeKey = astToCluesPath(pipePieces[0]);
    let domainKey = pipePieces.length === 2 ? astToCluesPath(pipePieces[1]) : _domain;
    if (!domainKey) {
      throw 'NO_DOMAIN';
    }

    let domainValues = Promise.map(self, d => clues(d, domainKey, $global).catch(noop));
    let rangeValues = Promise.map(self, d => clues(d, rangeKey, $global).catch(noop));

    domainValues = await domainValues;
    rangeValues = await rangeValues;

    // modify the items - but in a single tick, so should be safe
    self.forEach((d,i) => {
      d._domainValue = domainValues[i];
      d._rangeValue = rangeValues[i];
    });

    var d = self.filter(function(d) {
      return !isNaN(d._domainValue) && !isNaN(d._rangeValue);
    });

    if (!d.length) 
        throw 'NO_DATA';

    var isDate = (d[0]._domainValue.getFullYear && true) || false;

    var scale = d3Scale.scaleLinear()
      .domain(d.map(function(d) {
        return +d._domainValue;
      }))
      .range(d.map(function(d) {
        return +d._rangeValue;
      })); 

    function result(clamp,bound,mult) {
      let resultSelf = Object.create({
        value: createExternal(ast => {
          let pipePieces = ast.piped ? ast.piped : [ast];
          let d = pipePieces.map(p => {
            let d = astToCluesPath(p);
            if (isDate) d = new Date(d);
            if (bound && (+d > scale.domain()[1] || +d < scale.domain()[0]))
              throw 'OUT_OF_BOUNDS';
            return scale.clamp(clamp)(+d) * (mult || 1);
          });
          return d.length === 1 ? d[0] : d;
        }),
        change : function $external(d) {
          return [resultSelf,'value.'+d,function(d) {
            return (d[1]-d[0]);
          }];
        },
        ratio : function $external(d) {
          return [resultSelf,'value.'+d,function(d) {
            return (d[1]-d[0])/d[0];
          }];
        },
        index: createExternal(ast => {
          let pipePieces = ast.piped;
          if (!pipePieces || pipePieces.length !== 2) {
            throw 'index requires y|x';
          }
          let d = pipePieces.map(d => astToCluesPath(d));
          return [resultSelf,'value.'+d[1],function(e) {
            return result(clamp,bound, +d[0]/e);
          }];
        })
      },{
        $scale: {value: scale}
      });
      return resultSelf;
    }

    var res = result();
    res.clamp = function() {
      return result(true);
    };
    res.bound = function(){
      return result(false,true);
    };
    return res;   

  });
};

Query.$valueFn = function(d) { return d; };

// Pick returns a filtered subset of the records
Query.where = function(_filters, $valueFn, $global) {
  var self = this;
  return createExternal(ast => {
    let ref = astToCluesPath(ast);
    let fn = generateEvaluateConditionFn(self, ast, $global, _filters, $valueFn, 'and');
    return Promise.map(self, fn)
      .then(matches => {
        let results = self.filter((d,i) => matches[i]);

        if (!results) {
          throw {message:'INVALID_FILTER',filter:ref};
        }

        return Object.setPrototypeOf(results,Object.getPrototypeOf(self));
      });
  });
};

Query.where_not = function(_filters, $valueFn, $global) {
  var self = this;
  return createExternal(ast => {
    let ref = astToCluesPath(ast);
    let fn = generateEvaluateConditionFn(self, ast, $global, _filters, $valueFn, 'or');
    return Promise.map(self, fn)
      .then(matches => {
        let results = self.filter((d,i) => !matches[i]);

        if (!results) {
          throw {message:'INVALID_FILTER',filter:ref};
        }

        return Object.setPrototypeOf(results,Object.getPrototypeOf(self));
      });
  });
};

// legacy alias
Query.pick = Query.where;

Query.select = function($global) {
  var self = this;
  return createExternal(ast => {
    let rawPaths = ast.piped ? ast.piped : [ast];
    let directList = rawPaths.length === 1;
    let paths = rawPaths.map(path => {
      if (path.equation) {
        directList = false;
        let p = astToCluesPath(path.equation.left.equationPart);
        return {
          path: p,
          key: path.equation.right.equationPart
        };
      }
      let p = astToCluesPath(path);
      return {
        path: p,
        key: p.replace(/ᐉ/g,'.')
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
          d.sortkeyindex = i;
        });

        let nullOrUndefined = obj.filter(a => a.sortkey === null || a.sortkey === undefined);
        let sortable = obj.filter(a => !(a.sortkey === null || a.sortkey === undefined));

        sortable.sort(function(a,b) {
          let aVal = Number(a.sortkey);
          if (isNaN(aVal)) aVal = a.sortkey;
          let bVal = Number(b.sortkey);
          if (isNaN(bVal)) bVal = b.sortkey;
          if (typeof aVal !== typeof bVal) {
            aVal = typeof aVal;
            bVal = typeof bVal;
          }
          let result = comparator(aVal, bVal);
          if (result === 0) {
            return comparator(a.sortkeyindex, b.sortkeyindex);
          }
          return result;
        });

        obj = sortable.concat(nullOrUndefined); // preserves order of null/undefined and keeps at end of list, regardless of comparator

        return setPrototype(self)(obj);
      });
    });
  };
}

Query.ascending = createSortFunction((aVal,bVal) => aVal < bVal ? -1 : aVal > bVal ? 1 : 0);
Query.descending = createSortFunction((aVal,bVal) => aVal < bVal ? 1 : aVal > bVal ? -1 : 0);

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

  stats.$external = createExternal(ast => {
    if (ast.piped) {
      throw 'PIPES_NOT_SUPPORTED';
    }

    return [{q:self},`q.select.${astToCluesPath(ast)}.stats`,Object];
  });

  return stats;
};

Query.group_by = function($global,$fullref,$caller,_rank) {
  var self = this;

  return createExternal(ast => {
    if (ast.piped) {
      throw 'PIPES_NOT_SUPPORTED';
    }
    let obj = {};
    let field = astToCluesPath(ast);

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
  });
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