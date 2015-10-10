var sift = require('sift'),
    clues = require('clues'),
    Promise = clues.Promise;

// WARNING Sift exposes access to javascript through $where
// Here we override $where with an error
sift.useOperator('where',function() { throw 'NOT_ALLOWED';});


function toDots(d) {
  return d.replace(/ᐉ/g,'.');
}

function noop() {}

var Query = {

    data : undefined,

    rank : undefined,

    filter : function(_filters,data) {
      var self = this;
      return function $property(ref) {
      
        // Provide pipe delimited filtering
        ref = ref.split('|').sort();
        if (ref.length > 1)
          // Solve for the first one, and then the remainder
          return [ref[0],function(d) {
            return [d,'filter.'+ref.slice(1).join('|'),Object];
          }];
        ref = ref[0];

        ref = ref.split('=');

        var filter = {};
        if (ref.length == 2)
          filter[ref[0]] = ref[1];
        else
          filter = _filters && _filters[ref[0]];

        if (!filter) throw {message:'INVALID_FILTER',filter:ref};

        function filterData() {
          return sift(filter,data);
        }

        return Object.create(Object.getPrototypeOf(self),{
          data : { value: filterData }
        });
      };
    },

    first : function(data) {
      return data[0];
    },

    last : function(data) {
      return data[data.length-1];
    },

    pick : function(data) {
      return function $property(ref) {
        return data.map(function(d) {
          return d[ref];
        });
      };
    },

    fields : function(data) {
      return function $property(ref) {
        ref = ref.split('|');
        return data.map(function(d) {
          return ref.reduce(function(p,key) {
            p[key] = d[key];
            return p;
          },{});
        });
      };
    },

    reverse : function() {
      var self = this;
      return function $external(ref) {
        return [self,ref,function(d) {
          if (d.length)
            return d.slice().reverse();
          else 
            return Object.keys(d)
            .reverse()
            .reduce(function(p,key) {
              p[key] = d[key];
              return p;
            },{});
        }];
      };
    },

    count : function() {
      var self = this;
      return function $external(ref) {
        return [self,ref,function(d) {
          return Object.keys(d).length;
        }];
      };
    },

    stats : function() {
      var self = this;
      return {
        
        all : function $external(ref) {
          var min = Infinity,max=-Infinity;
          return [self,ref,function(d) {
            var sum = 0,count = Object.keys(d).length;
            var cumul =  Object.keys(d).reduce(function(p,key) {
              var value = d[key];
              if (value === undefined)
                return p;
              if (isNaN(value))
                throw {message:'NOT_A_NUMBER',value:value};
              p[key] = (sum+=value);
              min = Math.min(min,value);
              max = Math.max(max,value);
              return p;
            },{});

            return {
              cumul : cumul,
              sum : sum,
              count : count,
              avg : sum/count,
              max : max,
              min : min
            };
          }];
        },
        $property : function(field) {
          var self = this;
          return {
            $external : function(ref) {
              return [self,'all.'+ref,function(d) {
                return d[field];
              }];
            }
          };
        }
      };
    },

 
    group_by : function(data,$global,$fullref,_rank) {
      var self = this;
      return function $property(field) {
        // '|' is a shortcut for nested 'group_by'
        // This section collects piped groups so they
        // can be sent to the children
        field = field.split('|');
        var pipedGroups = ''+ field.slice(1).map(function(key) {
            return 'group_by.'+key+'.';
          }).join('');
        field = field[0];

        return {
          // lazily create children based on groups
          children : function() {

            // Group the data on the selected field
            var groups = data.reduce(function(p,d) {
              var key = d[field];
              p[key] = (p[key] || []).concat(d);
              return p;
            },{});

            // Order the keys
            var rank = _rank && _rank[field];

            var keys = Object.keys(groups)
              .sort(function(a,b) {
                if (rank) return rank.indexOf(a) - rank.indexOf(b);
                else return a.valueOf()-b.valueOf();
              });

            // A child with own set of data created for every group
            return keys.reduce(function(p,group) {
              p[':'+group] = Object.create(Object.getPrototypeOf(self),{
                data : { value: function() { return groups[group];}},
                group : { value : group }
              });
              return p;
            },{});
          },

          // Any ref is passed in full (with pipedGroups) to 
          // all children and results merged by key
          $external : function(ref) {            
            return function(children) {
              return Promise.props(Object.keys(children).reduce(function(p,key) {
                var fn = [pipedGroups+ref,function(d) { return d;}];
                p[key] = clues(children[key],fn,$global,'group_by',$fullref);
                return p;
              },{}));
            };
          }
        };
      };
    }
};

module.exports = Query;