function astToCluesPath(node) {
  return astToString(node.paren || node);
}

function astToString(node) {
  if (node.piped) {
    return node.piped.map(n => astToString(n)).join('|');
  }
  if (node.equation) {
    return `${astToString(node.equation.left)}${node.operation}${astToString(node.equation.right)}`;
  }
  if (node.paren) {
    return `(${astToString(node.paren)})`;
  }
  if (node.remoteLink) {
    return `\${${astToString(node.remoteLink)}}`;
  }
  if (node.quoted) {
    return `"${node.quoted.replace(/"/g,'\\"')}"`;
  }
  if (node.and) {
    return `and(${astToString(node.and)})`;
  }
  if (node.or) {
    return `or(${astToString(node.or)})`;
  }
  if (node.not) {
    return `not(${astToString(node.not)})`;
  }
  if (node.equationPart) {
    return astToString(node.equationPart);
  }
  if (node.math) {
    return `${node.operation}(${astToString(node.math)})`;
  }
  if (node.if) {
    return `if(${astToString(node.if.condition)}|${astToString(node.if.ifTrue)}|${astToString(node.if.ifFalse)})`;
  }
  if (Array.isArray(node)) {
    return node.map(n => astToString(n)).join('.');
  }
  return node;
}

module.exports = {
  astToCluesPath,
  astToString,
  pathParser: pathParser = require('./build/pegjs-parser').parse
};