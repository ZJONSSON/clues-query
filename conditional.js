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
  else if (ast.equationPart) {
    let target = ast.equationPart;
    if (target.quoted) {
      return () => Promise.resolve(target.quoted);
    }
    if (target.remoteLink) {
      let promise = clues({q:self}, 'q.'+astToCluesPath(target.remoteLink), $global)
        .catch(noop)
        .then($valueFn);
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
      return item => clues(item, path, $global).catch(noop).then($valueFn);
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
    if (target.math) {
      let fns = target.math.piped.map(node => generateEvaluateConditionFn(self, node, $global, _filters, $valueFn));
      let accumulator = null;
      switch (target.operation) {
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
      return item => conditionFn(item).then(d => d ? ifTrueFn(item) : ifFalseFn(item)).catch(() => ifFalseFn(item));
    }

    if (!useLiteral) {
      return item => clues(item, target, $global).catch(noop).then($valueFn);
    }

    return () => Promise.resolve(target);
  }
  else if (ast.equation) {
    let leftFn = generateEvaluateConditionFn(self, ast.equation.left, $global, _filters, $valueFn);
    let rightFn = ast.equation.right === '$exists' ? '$exists' : generateEvaluateConditionFn(self, ast.equation.right, $global, _filters, $valueFn, 'and', true);
    
    return async item => {
      let leftSide = await leftFn(item);
      if (rightFn === '$exists') {
        switch (ast.operation) {
          case '=': return (leftSide !== null) && (leftSide !== undefined); 
          case '!=': return (leftSide === null) || (leftSide === undefined); 
          default: return false;
        }
      }

      let rightSide = await rightFn(item);
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