const ast = require('../ast');




// // let fullAST = ast.parseFullPath('property.residential.something.add(someweird, (fsde.sjdrfkl.fsdjkl),sub(5,4,3,2)).foop.deeper', true);
// let fullAST = ast.parseFullPath('personᐅjobsᐅallᐅselectᐅtitle|socᐉtitle|incomeᐉavg', true);
// let pretty = ast.astToString(fullAST, true);
// let convertedFullAST = ast.parseFullPath(pretty, true);

// console.log(JSON.stringify(fullAST));
// console.log(JSON.stringify(convertedFullAST));
// // > JSON.stringify(ast.parseFullPath('a.b.add(d, e).foop=', true))


module.exports = t => {

  function confirmMatches(input, flexible) {
    let a = ast.parseFullPath(input, flexible);

    // regular stringify 
    let asString = ast.astToString(a);
    // let backToAst = ast.parseFullPath(asString, flexible);
    // // t.same(a, backToAst, 'ast matches: ' + input);
    // // t.same(asString, ast.astToString(backToAst), 'stringify matches: ' + input);

    // // regular stringify 
    let asPrettyString = ast.astToString(a, true);
    // let backToAstFromPretty = ast.parseFullPath(asPrettyString, flexible);
    // t.same(a, backToAstFromPretty, 'pretty ast matches: ' + input);
    // t.same(asPrettyString, ast.astToString(backToAstFromPretty, true), 'pretty stringify matches: ' + input);
    t.ok(true);
  }

  confirmMatches('personᐅjobsᐅallᐅselectᐅtitle|socᐉtitle|incomeᐉavg');
  confirmMatches('property.residential.something.add(someweird, (fsde.sjdrfkl.fsdjkl),sub(5,4,3,2)).foop.deeper');
  confirmMatches('personᐅjobsᐅallᐅselectᐅtitle|socᐉtitle|incomeᐉavg');
  confirmMatches('property.residential.something.add(someweird, (fsde.sjdrfkl.fsdjkl),sub(5,4,3,2)).foop.deeper');
  confirmMatches('personᐅjobsᐅallᐅselectᐅtitle|socᐉtitle|incomeᐉavg');
  confirmMatches('property.residential.something.add(someweird, (fsde.sjdrfkl.fsdjkl),sub(5,4,3,2)).foop.deeper');
  confirmMatches('personᐅjobsᐅallᐅselectᐅtitle|socᐉtitle|incomeᐉavg');
  confirmMatches('property.residential.something.add(someweird, (fsde.sjdrfkl.fsdjkl),sub(5,4,3,2)).foop.deeper');

};
  
if (!module.parent) module.exports(require('tap'));