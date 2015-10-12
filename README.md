#### Breaking changes - API completely redesigned from v 0.1.x

Recursive query model to any Array, using `clues`.  To transform a regular array into a 'queryable' array simple set the prototype to clues-query:

```js
var Query = require('clues-query');

var test = [1,2,3,4,5,6];

Object.setPrototypeOf(test,Query);
```

The following functions are recursively available:

### `.pick.[filterExpression]...`
Returns another cloned object of the array where the data has been filtered by the provided expression.  The expression can either by an equality (i.e. `.pick.openOrder=true`) or a named filter (which has to be a property of the object and will be evaluated with `sift`)

### `.select.[fieldname]...`
Returns an array of values specified by the `fieldname`.  If more than one fieldname is specified (separated by `|`) then the array will contain objects with the selected fields. Fields can be selected in dot notation by using the `ᐉ` charcter (U+1409) as a separator.   Each selection key can be renamed by appending `=[name]` to the fieldname.

Here is an example of how api paths can be flattened into a custom object:
```js
clues(obj,'select.personᐉfull_name=customer|orderᐉlastᐉamount=last_amt')
```

### `.expand`
Expands all functions or promises in each of the objects of the array, allowing the client to decide whether to evaluate all lazy-loaded properties within the array.

### `.group_by.[property]...`
Returns an array of child clones grouped by a particular property.  The children answer in unison to any additional chained methods.


### `.reversed`
Returns a clone with the data array reversed

### `.ascending.[$fieldname]
Returns a cloned array sorted ascending by the selected fieldname

### `.descending.[$fieldname]
Returns a cloned array sorted descending by the selected fieldname

### `.stats.[field]`
Returns an object of statistics.
* `.stats.sum` Sum
* `.stats.cumul` Cumulative sum
* `.stats.count` Count
* `.stats.avg` Average value
* `.stats.min` Minimum value
* `.stats.max` Maximum value

