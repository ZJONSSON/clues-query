Recursive query model to any dataset, using `clues`.  The module export is a prototype that should be cloned with `Object.create` with the relevant data placed into the `data` property.

The following functions are recursively available:

### `.filter.[filterExpression]...`
Returns another cloned object of clues-query where the data has been filtered by the provided expression.  The expression can either by an equality (i.e. `.filter.openOrder=true`) or a named filter (which has to be a property of the object and will be evaluated with `sift`)

### `.group_by.[property]...`
Returns an array of child clones grouped by a particular property.  The children answer in unison to any additional chained methods.

### `.pick.[fieldname]...`
Returns an array of values specified by the `fieldname`

### `.reverse...`
Returns a clone with the data array reversed

### `.count.[property]`
Returns an array of lengths for a given property

### `.stats.all`
Returns an array of statistics.  Each stat can be fetched separately:
* `.stats.sum` Sum
* `.stats.cumul` Cumulative sum
* `.stats.count` Count
* `.stats.avg` Average value
* `.stats.min` Minimum value
* `.stats.max` Maximum value

It's worth noting that stats are applied on items picked later in the chain.  

```js
clues(orders,'group_by.customer.stats.cumul.pick.charge')
```
