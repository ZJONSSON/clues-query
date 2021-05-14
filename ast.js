const parse = require('./build/pegjs-parser').parse;
const QuickLRU = require('quick-lru');
const clues = require('clues');
const MAX_DEPTH = 50;
const INDENTATION_AT_DEPTH = [...new Array(MAX_DEPTH)].map((d,i) => '  '.repeat(i));
const pathLRU = new QuickLRU({maxSize: 1000});
const fullLRU = new QuickLRU({maxSize: 1000});

function pathParser(path) {
  try {
    path = path.trim();
    let result = pathLRU.get(path);
    if (!result) {
      result = parse(path);
      pathLRU.set(path, result);
    }
    return result;
  }
  catch (e) {
    throw e.message; // make sure it isn't `Error`
  }
}

function astToCluesPath(node) {
  return astToString(node.paren || node);
}

function astToString(node, pretty=false, depth=0, ignoreFirstIndent=false) {
  let key = pretty ? undefined : depth + (ignoreFirstIndent ? 100 : 1);
  let cacheMap;
  if (key && node !== null && node !== undefined && typeof node === 'object') {
    cacheMap = node._cacheMap;
    if (!cacheMap) {
      Object.defineProperty(node, '_cacheMap', { value: {}, enumerable: false });
      cacheMap = node._cacheMap;
    }
    if (cacheMap) {
      let existingValue = cacheMap[key];
      if (existingValue !== undefined) {
        return existingValue;
      }
    }
  }

  if (depth > MAX_DEPTH) {
    depth = MAX_DEPTH;
  }

  let result;
  if (node.piped) {
    let prefix = '';
    if (pretty && node.piped.length > 1) {
      prefix = `\n${INDENTATION_AT_DEPTH[depth]}`;
    }
    result = node.piped.map((n,i) => ((!pretty || ignoreFirstIndent && i === 0) ? '' : prefix) + astToString(n, pretty, depth)).join(pretty ? ', ' : ',');
  }
  else if (node.equation) {
    result = `${astToString(node.equation.left, pretty, depth)}${node.operation}${astToString(node.equation.right, pretty, depth)}`;
  }
  else if (node.paren) {
    result = `(${astToString(node.paren, pretty, depth, true)})`;
  }
  else if (node.remoteLink) {
    result = `\${${astToString(node.remoteLink, pretty, depth+1, true)}}`;
  }
  else if (node.quoted) {
    result = `"${node.quoted.replace(/"/g,'\\"')}"`;
  }
  else if (node.and) {
    result = `and(${astToString(node.and, pretty, depth+1)})`;
  }
  else if (node.or) {
    result = `or(${astToString(node.or, pretty, depth+1)})`;
  }
  else if (node.not) {
    result = `not(${astToString(node.not, pretty, depth+1)})`;
  }  
  else if (node.in) {
    result = `in(${astToString(node.searchFor, pretty, depth+1)}, ${astToString(node.in, pretty, depth+1)})`;
  }
  else if (node.cq) {
    result = `cq(${astToString(node.cq, pretty, depth+1, true)})`;
  }
  else if (typeof node === "object" && node.split) {
    result = `split(${astToString(node.split.thingToSplit, pretty, depth+1)}${node.split.splitBy ? ',' +astToString(node.split.splitBy, pretty, depth+1) : ''})`;
  }
  else if (node.equationPart) {
    result = astToString(node.equationPart, pretty, depth);
  }
  else if (node.math) {
    result = `${node.operation}(${astToString(node.math, pretty, depth+1)}${pretty ? `\n${INDENTATION_AT_DEPTH[depth]}` : ''})`;
  }
  else if (node.date) {
    if (!node.secondParameter) {
      result = `${node.date}(${astToString(node.path, pretty, depth+1)})`;
    }
    else {
      result = `${node.date}(${astToString(node.path, pretty, depth+1)},${astToString(node.secondParameter, pretty, depth+1)})`;
    }
  }
  else if (node.if) {
    let prefix = pretty ? `\n${INDENTATION_AT_DEPTH[depth+1]}` : ''; 
    result = `if(${prefix}${astToString(node.if.condition, pretty, depth+1, true)},${prefix}${astToString(node.if.ifTrue, pretty, depth+1, true)},${prefix}${astToString(node.if.ifFalse, pretty, depth+1, true)})`;
  }
  else if (Array.isArray(node)) {
    result = node.map((n, i) => ((!pretty || ignoreFirstIndent && i === 0) ? '' : `\n${INDENTATION_AT_DEPTH[depth+i]}`) + astToString(n, pretty, depth+i, true)).join('.');
  }
  else {
    result = node;
  }

  if (cacheMap) {
    cacheMap[key] = result;
  }

  return result;
}

function parseFullPath(path, flexible=false) {
  let key = path + flexible;
  let existing = fullLRU.get(key);
  if (existing) {
    return existing;
  }

  let result = [];
  while (path && path.length > 0) {
    try {
      let parseResult = pathParser(path);
      result.push(parseResult.root);
      path = parseResult.extra;
    }
    catch (e) {
      if (flexible) {
        result.push(path);
        break;
      }
      else {
        throw e;
      }
    }
  }

  fullLRU.set(key, result);

  return result;
}

module.exports = {
  astToCluesPath,
  astToString,
  pathParser,
  parseFullPath
};