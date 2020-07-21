#### Breaking changes - API completely redesigned from v 0.1.x

Recursive query model to any Array, using `clues`.  To transform a regular array into a 'queryable' array simple set the prototype to clues-query:

```js
var Query = require('clues-query');

var test = [1,2,3,4,5,6];

Object.setPrototypeOf(test,Query);
```

The following functions are recursively available:

### `.where.[filterExpression]...`
Returns another cloned object of the array where the data has been filtered by the provided expression.  The expression can either by an operation (i.e. `.where.openOrder=true`) or a named filter (which has to be defined in the filters property (default behaviour is to fetch from `$global.input.filters`) and will be evaluated as if it were used directly)

(For legacy purposes `.pick` is an alias for `.where`)

## Equations
* `someField=test` will solve `someField` on each item, and the item will pass if the value is "test"
* `(some.deeper.field)=test` will solve `some.deeper.field` for each item, and check if it is "test"
* `someField="multiple words=cool"`, will use items which are exactly "multiple words=cool"
* `someField="multiple \"words\"=cool"`, will use items which are exactly 'multiple "words"=cool'
* `someField<5` 
* `someField<=5` 
* `someField>5` 
* `someField>=5` 
* `someField!=test` 
* `someField=$exists` will use if item has not null and not undefined for `someField`
* `someField=${stats.someField.max}` will solve `stats.someField.max` in the context of the *LIST* (not the item) and will use that value in the comparison
**Important Note**: `someField=test` assumes the lefthand side is to be solved for, but the right hand side is a literal value.  Either side can use literal values by wrapping them in quotes, and either side can use a solved value by wrapping it in parenthesis.  So this is equivalent, but more awkward: `"test"=(someField)`.

## Logical Operations
* `and(someField=test,someOtherField=test2)` 
* `and(someField=test|someOtherField=test2|someThirdField=test3)` 
* `or(someField=test|someOtherField=test2|someThirdField=test3)` 
* `not(someField=test)` 
* `not(or(someField=test|and(someField=test2,someOtherField=test)))` can be nested arbitrarily
* `not(or(someField=test|and(someField=test2,someOtherField=${global_input.someInput})))` can use `${}` deeply

## If Operations
* `if(someField,5,10)` If `someField` is truthy, then 5 otherwise 10.

## Mathematical Operations
* `add(someField,someOtherField)<10` 
* `sub(someField,someOtherField)<10` 
* `mul(someField,someOtherField)<10` 
* `div(someField,someOtherField)<10`
* `add(someField,5)<10` 
* `sub(someField,5)<10` 
* `mul(someField,5)<10` 
* `div(someField,5)<10`
* `add(someField|someOtherField|someThirdField)<10` 
* `sub(someField|someOtherField|someThirdField)<10` 
* `mul(someField|someOtherField|someThirdField)<10` 
* `div(someField|someOtherField)<10`
* `add(someField|5)<10` 
* `sub(someField|5|someThirdField)<10` 
* `mul(someField|5)<10` 
* `div(someField|5|someThirdField)<10`

## cq() Operation

Imagine the following array that has been clues-query-ified:
```
[
  {
    a: 5,
    b: [
      { count: 5, key: 'z' },
      { count: 7, key: 'y' }
    ]
  },
  {
    a: 9,
    b: [
      { count: 5, key: 'z' },
      { count: 7, key: 'x' },
      { count: 2, key: 'y' }
    ]
  }
]
```

If you wanted to find the items in this array where `b`'s greatest "count" has a key of "y", you'd want to do something like:
`.where.(b.descending.count.0.key)=y`

Unfortunately, it's possible that the sub-array in `b` is not a `clues-query` array!  So you can use the `cq()` method to turn that into a `clues-query` array and do further operations on it:
`.where.(cq(b).descending.count.0.key)=y`

### `.select.[fieldname]...`
Returns an array of values specified by the `fieldname`.  If more than one fieldname is specified (separated by `|`) then the array will contain objects with the selected fields. Fields can be selected in dot notation by using the `ᐉ` charcter (U+1409) as a separator.   Each selection key can be renamed by appending `=[name]` to the fieldname.

Here is an example of how api paths can be flattened into a custom object:
```js
clues(obj,'select.personᐉfull_name=customer|orderᐉlastᐉamount=last_amt')
```

Nested objects can now be selected using parenthesis:
```js
clues(obj,'select.(person.full_name)=customer|(order.last.amount)=last_amt')
```

Nested clues-query objects can also be references
```js
clues(obj,'select.(person.order.select.(order.amount).stats.avg)=average_amount')
```

All mathematical and logical operations in `where` are available in `select:
```js
clues(obj,'select.(add(person.order.select.(order.amount).stats.avg,5))=average_amount')
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
Returns a cloned array sorted ascending by the selected fieldname.  Can also be used as `.ascending.(longer.field.name)`

### `.descending.[$fieldname]`
Returns a cloned array sorted descending by the selected fieldname.  Can also be used as `.descending.(longer.field.name)`

### `.stats`
Returns an object of statistics.
* `.stats.sum` Sum
* `.stats.cumul` Cumulative sum
* `.stats.count` Count
* `.stats.avg` Average value
* `.stats.min` Minimum value
* `.stats.max` Maximum value

Stats assumes that the underlying array is an array of numeric values, not objects.   The numerical array can either be selected in beforehand by using `.select` to pick the field we want to run `stats` on.  Alternatively, the fieldname can be placed as a following argument, i.e. `stats.[fieldname].sum`.  Can also be used as `stats.(longer.field.name)`

### `.scale.[y-key]|[x-key]`
Returns a object that provides d3-like scale functions for a given variable for x and y. The object extrapolates by default and provides the following methods:
* `value.[x]` - interpolates/extrapolates a single value x
* `value.[x1|x2|x3...]` - interpolates/extrapolates a multiple values of x
* `change.[x1|x2]` - returns the difference between interpolated values for x1 and x2
* `ratio.[x1|x2]` - returns the ratio between interpolated values for x1 and x2
* `index.[baseX|baseY]` - returns a scale that is rebased to the baseX and baseY (i.e. asking for baseX will give you baseY)
* `clamp` - returns scale object that does not extrapolate (i.e. values will be flat from both ends of the range)
* `bound` - returns scale object that will throw an error for any variables outside of the domain

### `.join` and `.connect`
Returns a string concatenation of all values, either separated by ampersand (`.join`) or with no separator (`.connect`).  As this is a string concatination you probably need to select the string properties first, example: `distinct.Country.join`

### `.cq.(path.to.something.in.item)`

Will make sure the results of `cq` is a clues-query array.  Will operate only on the first element of the array and solve into that item and wrap the result in an array if it isn't already an array

### `.solve.(path.to.something.in.item)`

Equivalent to `.select.[xxxx].0`.  Any arrays returned will be `clues-query` arrays.

