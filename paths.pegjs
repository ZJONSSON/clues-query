
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
  = And / Not / Or / Equation / Base64FriendlyWord / Word / ParenExpr

Not = "not(" path:Path ")" { return { not: path }; }
And = "and(" path:Path ")" { return { and: path }; }
Or = "or(" path:Path ")" { return { or: path }; }

ImpliedParenExpr = head:WordOrParen tail:("ᐉ" WordOrParen)+ {
  return {
    paren: [head].concat(tail.map(e => e[1]))
  }
}

RightSideOfEquation = "${" remoteLink:PathList "}" {
  return { remoteLink }
} / Word

Equation = left:(ImpliedParenExpr / WordOrParen) "=" right:RightSideOfEquation {
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

Base64FriendlyWord = [^.ᐉᐅ()|Λ=\$\{\}]+[=]?[=]? {
  return text();
}

Word = [^.ᐉᐅ()|Λ=\$\{\}]+ {
  return text();
}

Separator 
  = "." / "ᐉ" / "ᐅ"
