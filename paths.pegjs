
Root
  = head:Path tail:(Separator Extra)? {
  return {
    root: head,
    extra: tail && tail[1]
  }
}

Extra = .* {
  return text()
}

Expression
  = PathList
  
PathList 
  = head:Path tail:(Separator Path)* {
  return [head].concat(tail.map(e => e[1]));
}
  
Path = head:PathPart tail:(PathSeparator PathPart?)* {
  if (tail.length > 0) {
    return {
      piped: [head].concat(tail.map(e => e[1])).filter(a => a !== null)
    };
  }
  return head;
}

PathSeparator = _ ("|" / "Λ" / ",") _
  
PathPart
  = And / Not / Or / Equation / TopLevelOperation  / ImpliedParenExpr / Word / ParenExpr

Not = "not(" _ path:Path _ ")" { return { not: path }; }
And = "and(" _ path:Path _ ")" { return { and: path }; }
Or = "or(" _ path:Path _ ")" { return { or: path }; }

ImpliedParenExpr = head:WordOrParen tail:("ᐉ" WordOrParen)+ {
  return {
    paren: [head].concat(tail.map(e => e[1]))
  }
}

Exists = "$exists"

RemoteLink = "${" _ remoteLink:PathList _ "}" {
  return { remoteLink }
}



MathExpression = operation:("add"/"sub"/"mul"/"div") _ "(" _ path:EquationPartList _ ")" {
  return {
    operation,
    math: path
  }
}

CqExpression = operation:("cq") _ "(" _ path:Expression _ ")" {
  return {
    cq: path
  }
}

If = "if(" _ condition:(Equation / ParenExpr) PathSeparator ifTrue:EquationPart PathSeparator ifFalse:EquationPart _ ")" { return { 
    if: {
      condition, ifTrue, ifFalse
    } 
  }; 
}

Operation = MathExpression / CqExpression / If
TopLevelOperation = equationPart:Operation {
  return { equationPart }
}

EquationPart = equationPart:(ParenExpr / Operation / ImpliedParenExpr / RemoteLink / StringLiteral / WordOrParen) {
  return { equationPart }
}
EquationPartList = head:EquationPart tail:(PathSeparator EquationPart)+ {
  return {
    piped: [head].concat(tail.map(e => e[1])).filter(a => a !== null)
  };
}

Equation = left:EquationPart _ operation:EquationOperation _ right:(Exists / EquationPart) {
  return {
    equation: { left, right },
    operation
  }
}

EquationOperation = "=" / "<=" / ">=" / "<" / ">" / "!=" { return text(); }

WordOrParen = Word / ParenExpr
  
ParenExpr 
  = "(" expr:Expression ")" {
  return {
    paren: expr
  }
}

StringLiteral = '"' chars:DoubleStringCharacter* '"' {
    return {quoted:chars.join('')};  
  }
  
DoubleStringCharacter
  = '\\' '"' { return '"'; }
  / !'"' . { return text(); }

Word = [^.ᐉᐅ()|,Λ=\$\{\}<>! \n]+ {
  return text();
}

Separator 
  = _ ("." / "ᐉ" / "ᐅ") _
  
_
 = [ \n]*