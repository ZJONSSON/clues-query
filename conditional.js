const moment = require('moment');
const fuzz = require('fuzzball');

const clues = require('clues'),
      { pathParser, astToCluesPath, astToString } = require('./ast'),
      Promise = clues.Promise;

function setPrototype(self) {
  return function(d) {
    return Object.setPrototypeOf(d,Object.getPrototypeOf(self));
  };        
}
function inverseIdentity(d) { return !d; }
function identity(d) { return d; }
function noop() {}

const MOMENTS_UNITS = {
  'addmonths': 'months',
  'adddays': 'days',
  'addyears': 'years',
  'addweeks': 'weeks',
  'addhours': 'hours'
};
const INVALID_DATE = new Date(Number.NaN);

function toDate(value, format) {
  if (!value) {
    return INVALID_DATE;
  }
  return moment(value, format).startOf('day').toDate();
}

function toDateTime(value, format) {
  if (!value) {
    return INVALID_DATE;
  }
  return moment(value, format).toDate();
}

function isTruthy(d) {
  if (d instanceof Date) {
    return Number.isFinite(d.getTime());
  }
  return !!d;
}

function generateEvaluateConditionFn(self, ast, $global, _filters, $valueFn, pipeOperation, useLiteral=false) {
  if (ast.piped) {
    let operations = ast.piped.map(a => generateEvaluateConditionFn(self, a, $global, _filters, $valueFn));
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
  else if (ast.not) {
    let fn = generateEvaluateConditionFn(self, ast.not, $global, _filters, $valueFn, 'or');
    return item => fn(item).then(inverseIdentity);
  }
  else if (ast.or) {
    return generateEvaluateConditionFn(self, ast.or, $global, _filters, $valueFn, 'or');
  }
  else if (ast.and) {
    return generateEvaluateConditionFn(self, ast.and, $global, _filters, $valueFn, 'and');
  }
  else if (ast.in) {
    let arrFn = generateEvaluateConditionFn(self, ast.in.equationPart ? ast.in : {equationPart: ast.in}, $global, _filters, $valueFn, 'and');
    let searchForFn = generateEvaluateConditionFn(self, {equationPart: ast.searchFor}, $global, _filters, $valueFn, 'and', true);
    return async item => {
      let arr = arrFn(item);
      let searchFor = searchForFn(item);
      arr = await arr;
      searchFor = await searchFor;

      if (Array.isArray(arr)) {
        return arr.indexOf(searchFor) >= 0;
      }
      if (!searchFor || !arr) {
        return false;
      }
      return String(arr).toLowerCase().indexOf(String(searchFor).toLowerCase()) >= 0;
    };
  }
  else if (ast.equationPart) {
    let target = ast.equationPart;
    if (target.quoted) {
      return () => Promise.resolve(target.quoted);
    }
    if (target.remoteLink) {
      let promise = clues({q:self}, 'q.'+astToCluesPath(target.remoteLink), $global)
        .catch(noop);
      return () => promise;    
    }
    if (target.paren) {
      if (typeof target.paren[0] !== 'string') {
        let remainder = target.paren.length > 1 ? astToCluesPath(target.paren.slice(1)) : null;
        let fn = generateEvaluateConditionFn(self, target.paren[0], $global, _filters, $valueFn);
        return item => {
          return fn(item).then(results => {
            if (remainder) {
              return clues({q:results}, `q.${remainder}`, $global);
            }
            return results;
          });
        };
      }
      let path = astToCluesPath(target);
      return item => clues(item, path, $global).catch(noop);
    }

    let valAsFloat = parseFloat(target);
    if (valAsFloat == target) {
      target = valAsFloat;
    }
    else if (target === 'true') {
      return () => Promise.resolve(true);
    }
    else if (target === 'false') {
      return () => Promise.resolve(false);
    }

    if (target.cq) {
      let path = astToCluesPath(target.cq);
      let cqify = setPrototype(self);
      return item => clues(item, path, $global).then(values => {
        if (!Array.isArray(values)) {
          return cqify([values]);
        }
        if (!values.__cluesQuerified) {
          return cqify(values);
        }
        return values;
      });
    }
    if (typeof target === "object" && target.split) {
      let fns = [];
      fns.push(generateEvaluateConditionFn(self,target.split.thingToSplit,$global,_filters,$valueFn));
      if (target.split.splitBy) {
        fns.push(generateEvaluateConditionFn(self,target.split.splitBy,$global,_filters,$valueFn))
      } else {
        fns.push(() => Promise.resolve(","));
      }
      return item => {
        let promises = fns.map(fn => fn(item));
        return Promise.all(promises).then(([thingToSplit,splitBy]) => {
          // It's possible that splitBy will be empty.  For example, if you specify a field for splitBy, it will
          // get evaluated for each record, and some records may not have that field.  In such a case, we don't
          // want to use a default comma.
          if (thingToSplit && splitBy) {
            if (typeof thingToSplit === "string") {
              return thingToSplit.split(splitBy);
            }  
          }
          return thingToSplit;
        });
      };
    }
    if (target.math) {
      let fns = target.math.piped.map(node => generateEvaluateConditionFn(self, node, $global, _filters, $valueFn));
      let accumulator = null;
      switch (target.operation) {
        case 'arr': accumulator = setPrototype(self); break;
        case 'add': accumulator = values => values.reduce((acc, value) => acc+value); break;
        case 'sub': accumulator = values => values.reduce((acc, value) => acc-value); break;
        case 'mul': accumulator = values => values.reduce((acc, value) => acc*value); break;
        case 'div': accumulator = values => values.reduce((acc, value) => acc/value); break;
      }
      return item => Promise.map(fns, fn => fn(item)).then(values => {
        return accumulator(values);
      });
    }

    if (target.if) {
      let conditionFn = generateEvaluateConditionFn(self, target.if.condition, $global, _filters, $valueFn, 'and');
      let ifTrueFn = generateEvaluateConditionFn(self, target.if.ifTrue, $global, _filters, $valueFn);
      let ifFalseFn = generateEvaluateConditionFn(self, target.if.ifFalse, $global, _filters, $valueFn);
      return item => conditionFn(item).then(d => isTruthy($valueFn(d)) ? ifTrueFn(item) : ifFalseFn(item)).catch(() => ifFalseFn(item));
    }

    if (target.fuzzy) {
      let word1Fn = generateEvaluateConditionFn(self, target.fuzzy.word1.equationPart ? target.fuzzy.word1 : {equationPart: target.fuzzy.word1}, $global, _filters, $valueFn);
      let word2Fn = generateEvaluateConditionFn(self, target.fuzzy.word2.equationPart ? target.fuzzy.word2 : {equationPart: target.fuzzy.word2}, $global, _filters, $valueFn);
      return async item => {
        let word1 = word1Fn(item);
        let word2 = word2Fn(item);
        return fuzz.token_set_ratio(String(await word1), String(await word2));
      }
    }

    if (target.coalesce) {
      let fns = target.coalesce.piped.map(node => generateEvaluateConditionFn(self, node, $global, _filters, $valueFn));
      return async item => {
        for (let fn of fns) {
          let result = await fn(item);
          if (isTruthy(result)) {
            return result;
          }
        }
      }
    }
    
    if (target.date) {
      let pathFn = generateEvaluateConditionFn(self, target.path, $global, _filters, $valueFn);
      let secondFn = target.secondParameter ? generateEvaluateConditionFn(self, target.secondParameter, $global, _filters, $valueFn, 'and', true) : null;

      if (target.date === 'date') {
        return async item => {
          let format = secondFn ? secondFn(item) : null;
          let date = $valueFn(await pathFn(item));
          if (format) {
            format = $valueFn(await format);
          }
          return toDate(date, format);
        };
      }

      if (target.date === 'datetime') {
        return async item => {
          let format = secondFn ? secondFn(item) : null;
          let date = $valueFn(await pathFn(item));
          if (format) {
            format = $valueFn(await format);
          }
          return toDateTime(date, format);
        };
      }
  
      return async item => {
        let date = pathFn(item);
        let amount = secondFn(item);
        date = moment(toDateTime($valueFn(await date)));
        amount = $valueFn(await amount);
        date.add(amount, MOMENTS_UNITS[target.date]);
        return date.toDate();
      };
    }

    if (!useLiteral) {
      return item => clues(item, target, $global).catch(noop);
    }

    return () => Promise.resolve(target);
  }
  else if (ast.equation) {
    let leftFn = generateEvaluateConditionFn(self, ast.equation.left, $global, _filters, $valueFn);
    let rightFn = ast.equation.right === '$exists' ? '$exists' : generateEvaluateConditionFn(self, ast.equation.right, $global, _filters, $valueFn, 'and', true);
    
    return async item => {
      let leftSide = leftFn(item);
      if (rightFn === '$exists') {
        leftSide = $valueFn(await leftSide);
        switch (ast.operation) {
          case '=': return (leftSide !== null) && (leftSide !== undefined); 
          case '!=': return (leftSide === null) || (leftSide === undefined); 
          default: return false;
        }
      }

      // leftside has already been kicked off, so we can await for both
      let rightSide = $valueFn(await rightFn(item));
      leftSide = $valueFn(await leftSide);

      if (rightSide instanceof Date || leftSide instanceof Date || rightSide instanceof moment || leftSide instanceof moment) {
        rightSide = toDateTime(rightSide).getTime();
        leftSide = toDateTime(leftSide).getTime();
      }

      switch (ast.operation) {
        case '=': return leftSide == rightSide;
        case '<': return leftSide < rightSide;
        case '<=': return leftSide <= rightSide;
        case '>': return leftSide > rightSide;
        case '>=': return leftSide >= rightSide;
        case '!=': return leftSide != rightSide;
      }
    };  
  }
  else if (ast.paren) {
    return generateEvaluateConditionFn(self, {equationPart:ast}, $global, _filters, $valueFn);
  }
  else {
    let key = astToCluesPath(ast);
    if (_filters && _filters[key]) {
      return generateEvaluateConditionFn(self, pathParser(_filters[key]).root, $global, _filters, $valueFn, pipeOperation);
    }
    throw { message:'INVALID_FILTER' };
  }
}

module.exports = generateEvaluateConditionFn;