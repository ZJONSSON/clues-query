const parse = require('./build/pegjs-parser').parse;
const MAX_DEPTH = 50;
const INDENTATION_AT_DEPTH = [...new Array(MAX_DEPTH)].map((d,i) => '  '.repeat(i));

function pathParser(path) {
  return parse(path.trim());
}

function astToCluesPath(node) {
  return astToString(node.paren || node);
}

function astToString(node, pretty=false, depth=0, ignoreFirstIndent=false) {
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
  else if (node.cq) {
    result = `cq(${astToString(node.cq, pretty, depth+1, true)})`;
  }
  else if (node.equationPart) {
    result = astToString(node.equationPart, pretty, depth);
  }
  else if (node.math) {
    result = `${node.operation}(${astToString(node.math, pretty, depth+1)}${pretty ? `\n${INDENTATION_AT_DEPTH[depth]}` : ''})`;
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
  return result;
}

function parseFullPath(path, flexible=false) {
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
  return result;
}

module.exports = {
  astToCluesPath,
  astToString,
  pathParser,
  parseFullPath
};