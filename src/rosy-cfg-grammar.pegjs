/// Rosy metasyntax

G = _ head:(rule (rule_end _ r:rule {return r})* rule_end? _)? {
  if (head && head.length)
  {
    return [head[0], ...head[1]]
  }
  return []
}

rule = r0:rulemod _ r1:name _ ruleassign _ c:rulecontent {
  return {
    "type": "rule",
    "mod": {"~": "remove", "@": "remove", "+": "after", "-": "before"}[`${r1}`],
    "name": r1,
    "tokens": c
  }
}
rule_end = _s "\n" / _s ";" / _s ","
rulemod = ("@")
 / ("~")
 / ("+")
 / ("-")
 / ("")
ruleassign = "=" / "->" / "<-"
rulecontent = a:ruletoken b:(_s t:ruletoken {return t})* {
  return [a, ...b]
}

ruletoken =
    (sub:subrule decorator:ruledecorator? {return {...sub, "decorator": decorator}})
  / (symbol:name decorator:ruledecorator? {return {"type": "symbol", "name": symbol, "decorator": decorator}})
  / (nil:'~' {return {"type": "nil"}})
  / (lit:literal {
    return {"type": "literal", "value": lit}
  })

ruledecorator = '?' / '+' / '*' / '*%~' / '+%~'

literal = qliteral / qqliteral

qliteral  = "'" content:((("\\'" {return "'"}) / [^'])*) "'" {return content.join("")}
qqliteral = '"' content:((('\\"' {return '"'}) / [^"])*)  '"' {return content.join("")}

subrule = symbol:name _s ':' _s '(' _s content:rulecontent _s ')' {
  return {
    "type": "subrule",
    "name": symbol,
    "content": content
  }
}

name = $ (namecharstart (namechar)*)
namecharstart = [a-zA-Z_\%]
namechar = [a-zA-Z0-9_\%\-]

_s "space"
  = _s_*

_s_
  = [ \t] / "#<" (">" [^#] / [^>] ">#" )

_ "whitespace"
  = (_s_ / [\n\r] / "#" [^\n]* "\n")*