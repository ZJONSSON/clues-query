
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

PathSeparator = "|" / "Λ"
  
PathPart
  = Equation / Base64Word / Word / ParenExpr

ImpliedParenExpr = head:WordOrParen tail:("ᐉ" WordOrParen)+ {
  return {
    paren: [head].concat(tail.map(e => e[1]))
  }
}

Equation = left:(ImpliedParenExpr / WordOrParen) "=" right:Word {
  return {
    eq: { left, right }
  }
}

WordOrParen = Word / ParenExpr
  
ParenExpr 
  = "(" expr:Expression ")" {
  return {
    paren: expr
  }
}

Base64Word = [^.ᐉᐅ()|Λ=]+[=]?[=]? {
  return text();
}

Word = [^.ᐉᐅ()|Λ=]+ {
  return text();
}

Separator 
  = "." / "ᐉ" / "ᐅ"
