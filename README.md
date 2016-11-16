#### Breaking changes - API completely redesigned from v 0.1.x

Recursive query model to any Array, using `clues`.  To transform a regular array into a 'queryable' array simple set the prototype to clues-query:

```js
var Query = require('clues-query');

var test = [1,2,3,4,5,6];

Object.setPrototypeOf(test,Query);
```

The following functions are recursively available:

### `.where.[filterExpression]...`
Returns another cloned object of the array where the data has been filtered by the provided expression.  The expression can either by an equality (i.e. `.where.openOrder=true`) or a named filter (which has to be defined in the filters property (default behaviour is to fetch from `$global.input.filters`) and will be evaluated with `sift`)

(For legacy purposes `.pick` is an alias for `.where`)

### `.select.[fieldname]...`
Returns an array of values specified by the `fieldname`.  If more than one fieldname is specified (separated by `|`) then the array will contain objects with the selected fields. Fields can be selected in dot notation by using the `ᐉ` charcter (U+1409) as a separator.   Each selection key can be renamed by appending `=[name]` to the fieldname.

Here is an example of how api paths can be flattened into a custom object:
```js
clues(obj,'select.personᐉfull_name=customer|orderᐉlastᐉamount=last_amt')
```

### `.distinct.[fieldname]`
Same as `.select` except the returned array will be filtered to distinct values

### `.expand`
Expands all functions or promises in each of the objects of the array, allowing the client to decide whether to evaluate all lazy-loaded properties within the array.

### `.group_by.[property]...`
Returns an array of child clones grouped by a particular property.  The children answer in unison to any additional chained methods.


### `.reversed`
Returns a clone with the data array reversed

### `.ascending.[$fieldname]`
Returns a cloned array sorted ascending by the selected fieldname

### `.descending.[$fieldname]`
Returns a cloned array sorted descending by the selected fieldname

### `.stats`
Returns an object of statistics.
* `.stats.sum` Sum
* `.stats.cumul` Cumulative sum
* `.stats.count` Count
* `.stats.avg` Average value
* `.stats.min` Minimum value
* `.stats.max` Maximum value

Stats assumes that the underlying array is an array of numeric values, not objects.   The numerical array can either be selected in beforehand by using `.select` to pick the field we want to run `stats` on.  Alternatively, the fieldname can be placed as a following argument, i.e. `stats.[fieldname].sum`

### `.scale.[y-key]|[x-key]`
Returns a object that provides d3-like scale functions for a given variable for x and y. The object extrapolates by default and provides the following methods:
* `value.[x]` - interpolates/extrapolates a single value x
* `value.[x1|x2|x3...]` - interpolates/extrapolates a multiple values of x
* `change.[x1|x2]` - returns the difference between interpolated values for x1 and x2
* `ratio.[x1|x2]` - returns the ratio between interpolated values for x1 and x2
* `index.[baseX|baseY]` - returns a scale that is rebased to the baseX and baseY (i.e. asking for baseX will give you baseY)
* `clamp` - returns scale object that does not extrapolate (i.e. values will be flat from both ends of the range)
* `bound` - returns scale object that will throw an error for any variables outside of the domain
