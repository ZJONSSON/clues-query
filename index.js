var sift = require('sift'),
    clues = require('clues'),
    pathParser = require('./build/pegjs-parser').parse,
    d3Scale = require('d3-scale'),
    Promise = clues.Promise;

function setPrototype(self) {
  return function(d) {
    return Object.setPrototypeOf(d,Object.getPrototypeOf(self));
  };        
}

// WARNING Sift exposes access to javascript through $where
// Here we override $where with an error
const siftOptions = { operations: { $where: function() { throw '$WHERE_NOT_ALLOWED'; } } };
 
// Helper functions
function noop() {}
function inverseIdentity(d) { return !d; }
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
    let firstNode = ast.root;
    let firstNodeKey = `_counter${astToString(firstNode)}`;
    let remainder = ast.extra ? `.${ast.extra}` : '';

    let existingCounter = context[firstNodeKey];
    if (!existingCounter) {
      existingCounter = ++counter;
      context[firstNodeKey] = existingCounter;
      Object.defineProperty(context, `externalKey${existingCounter}`, {value: cb(firstNode), enumerable: true, configurable: true, writable: true});
    }

    return [context, `externalKey${existingCounter}${remainder}`,identity];
  };
}

Query.scale = function(_domain, $global) {
  var self = this;

  return createExternal(async ast => {
    let pipePieces = ast.piped ? ast.piped : [ast];
    if (pipePieces.length >= 3) {
      throw 'MAXIMUM_OF_THREE_INPUTS';
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

function generateEvaluateConditionFn(ast, $global, _filters, $valueFn, pipeOperation) {
  if (ast.piped) {
    let operations = ast.piped.map(a => generateEvaluateConditionFn(a, $global, _filters, $valueFn));
    return item => Promise.map(operations, operation => operation(item))
              .then(results => {
                if (pipeOperation === 'and') {
                  return !results.some(inverseIdentity);
                }
                else {
                  return results.some(identity);
                }
              });
  }
  else if (ast.eq) {
    let path = astToCluesPath(ast.eq.left);
    let target = ast.eq.right;
    if (target === 'true') target = true;
    if (target === 'false') target = false;
    
    return item => clues(item, path, $global).catch(noop).then(results => {
      return $valueFn(results) == target;
    });  
  }
  else {
    let siftConfig = null;
    let key = astToCluesPath(ast);
    if (_filters && _filters[key]) {
      siftConfig = _filters[key];
    }
    // if base 64 then decode as json
    else if (/^[A-Za-z0-9]+=?=?$/.test(key)) {
      siftConfig = Buffer ? Buffer.from(key, 'base64').toString('ascii') : atob(key);
    }
    else {
      siftConfig = key;
    }

    if (siftConfig && typeof siftConfig === 'string') {
      try {
        siftConfig = JSON.parse(siftConfig);
      }
      catch (e) {
        throw {message:'INVALID_FILTER'};    
      }
    }

    let options = Object.assign({ comparator: (a,b) => $valueFn(a) == $valueFn(b) }, siftOptions);
    return sift(siftConfig, options);
  }
}

// Pick returns a filtered subset of the records
Query.where = function(_filters, $valueFn, $global) {
  var self = this;
  return createExternal(ast => {
    let ref = astToCluesPath(ast);
    let fn = generateEvaluateConditionFn(ast, $global, _filters, $valueFn, 'and');
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
    let fn = generateEvaluateConditionFn(ast, $global, _filters, $valueFn, 'or');
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
      if (path.eq) {
        directList = false;
        let p = astToCluesPath(path.eq.left);
        return {
          path: p,
          key: path.eq.right
        };
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
          if ((aNull || bNull) && !(aNull && bNull)) {
            return (aNull && !bNull) ? 1 : (bNull && !aNull) ? -1 : 0;
          }
          let aVal = aNull ? a.sortkey : Number(a.sortkey);
          if (!aNull && isNaN(aVal)) aVal = a.sortkey;
          let bVal = bNull ? b.sortkey : Number(b.sortkey);
          if (!bNull && isNaN(bVal)) bVal = b.sortkey;
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