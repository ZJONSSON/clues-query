const ast = require('../ast');

module.exports = t => {

  function confirmMatches(input, flexible) {
    let a = ast.parseFullPath(input, flexible);

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
  confirmMatches('distinct.$root');
  confirmMatches('property.residential.something.add(someweird,(fsde.sjdrfkl.fsdjkl),sub(5,4,3,2)).foop.deeper');
  confirmMatches('property.residential.something.add(someweird,(fsde.sjdrfkl.fsdjkl)|sub(5,(cq(a.b).solve.add((a.b.d), if((a.b.c=5),"yo",${someNestedThing}),3,2)))).foop.deeper');
  confirmMatches('where.in(test2, arr(b, "C"))');
  confirmMatches('where.addyears(addmonths(adddays(testDate,4),3),-1)=date("2019-07-05 12:13:15 pm")');

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

  t.throws(() => confirmMatches(broken), 'should error');
  confirmMatches(broken, true);


  // t.test('parse speeds', t => {
  console.log('parse speed test running?')

  
  let key = 'property.residential.something.add(someweird,(fsde.sjdrfkl.fsdjkl)|sub(5,(cq(a.b).solve.add((a.b.d), if((a.b.c=5),"yo",${someNestedThing}),3,2)))).foop.deeper';
  let startTime = Date.now();
  for (let i = 0; i < 10000; i++) {
    let a = ast.parseFullPath(key);
    let asString = ast.astToString(a);
  }
  let duration = Date.now() - startTime;
  console.log(duration);
  t.ok(duration < 600); // make sure we can do 10000 paths in way less than 600ms (takes 50ms for me)
};
  
if (!module.parent) module.exports(require('tap'));