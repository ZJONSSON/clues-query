const ast = require('../ast');

module.exports = t => {

  function confirmMatches(input, flexible) {
    let a = ast.parseFullPath(input, flexible);

    console.log(a);

    // regular stringify 
    let asString = ast.astToString(a);
    let backToAst = ast.parseFullPath(asString, flexible);
    t.same(a, backToAst, 'ast matches: ' + input);
    t.same(asString, ast.astToString(backToAst), 'stringify matches: ' + input);

    // regular stringify 
    let asPrettyString = ast.astToString(a, true);
    let backToAstFromPretty = ast.parseFullPath(asPrettyString, flexible);
    t.same(a, backToAstFromPretty, 'pretty ast matches: ' + input);
    t.same(asPrettyString, ast.astToString(backToAstFromPretty, true), 'pretty stringify matches: ' + input);
  }

  confirmMatches('personᐅjobsᐅallᐅselectᐅtitle|socᐉtitle|incomeᐉavg');
  confirmMatches('property.residential.something.add(someweird,(fsde.sjdrfkl.fsdjkl),sub(5,4,3,2)).foop.deeper');
  confirmMatches('property.residential.something.add(someweird,(fsde.sjdrfkl.fsdjkl)|sub(5,(cq(a.b).solve.add((a.b.d), if((a.b.c=5),"yo",${someNestedThing}),3,2)))).foop.deeper');

  // this has tabs in it! ON PURPOSE
  confirmMatches(`property.
  custom.
    transactions.
      all.
        where.
          and(
           	amount<900000, 
           	(or(amount>10000))).
          	descending.
              amount.
                0.
                  buyer.
                    1.
                      person.
                        income.
                          all`);

  let broken = 'property.residential.something.add(someweird,(fsde.sjdrfkl.fsdjkl)|sub(5,(cq(a.b).solve.add((a.b.d), if((a.b.c=5),"yo",${someNestedThing.that.is.deep}),3,2)))).foop.-31=23=fdsjklfajZXZZzzffgjdsktgsk';
  try {
    confirmMatches(broken);
    t.ok(false, 'should error');
  }
  catch (e) {
    t.ok(true, 'should error');
  }

  confirmMatches(broken, true);

};
  
if (!module.parent) module.exports(require('tap'));