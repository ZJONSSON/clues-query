
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

PathSeparator = "|" / "Λ" / ","
  
PathPart
  = And / Not / Or / Equation / TopLevelOperation  / ImpliedParenExpr / Word / ParenExpr

Not = "not(" path:Path ")" { return { not: path }; }
And = "and(" path:Path ")" { return { and: path }; }
Or = "or(" path:Path ")" { return { or: path }; }

ImpliedParenExpr = head:WordOrParen tail:("ᐉ" WordOrParen)+ {
  return {
    paren: [head].concat(tail.map(e => e[1]))
  }
}

Exists = "$exists"

RemoteLink = "${" remoteLink:PathList "}" {
  return { remoteLink }
}

MathExpression = operation:("add"/"sub"/"mul"/"div") "(" path:EquationPartList ")" {
  return {
    operation,
    math: path
  }
}

If = "if(" condition:(ParenExpr / Equation) PathSeparator ifTrue:EquationPart PathSeparator ifFalse:EquationPart ")" { return { 
    if: {
      condition, ifTrue, ifFalse
    } 
  }; 
}

Operation = MathExpression / If
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

Equation = left:EquationPart operation:EquationOperation right:(Exists / EquationPart) {
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

Word = [^.ᐉᐅ()|,Λ=\$\{\}<>!]+ {
  return text();
}

Separator 
  = "." / "ᐉ" / "ᐅ"
  