/// Rosy metasyntax

Expression
  = head:Term tail:(_ ("+" / "-") _ Term)* {
      return tail.reduce(function(result, element) {
        if (element[1] === "+") { return result + element[3]; }
        if (element[1] === "-") { return result - element[3]; }
      }, head);
    }

Term
  = head:Factor tail:(_ ("*" / "/") _ Factor)* {
      return tail.reduce(function(result, element) {
        if (element[1] === "*") { return result * element[3]; }
        if (element[1] === "/") { return result / element[3]; }
      }, head);
    }

Factor
  = "(" _ expr:Expression _ ")" { return expr; }
  / Integer

Integer "integer"
  = _ [0-9]+ { return parseInt(text(), 10); }

_ "whitespace"
  = [ \t\n\r]*


G = _ (rule _)* {
  return "hello!!"
}
rule = rulemod _ rulename _ ruleassign _ rulecontent rule_end
rule_end = "\n" / _ ";" / _ ","
rulemod = "@" / "~" / "-" / "+" / ""
rulename = name
ruleassign = "=" / "->" / "<-"
rulecontent = "hello"

name = namechar (namechar)*
namecharstart = [a-zA-Z_\%]
namechar = [a-zA-Z0-9_\%\-\*\~\+\?]

_s "space"
  = _s_*

_s_
  = [ \t] / "#<" (">" [^#] / [^>] ">#" )

__ "whitespace"
  = (_s_ / [\n\r] / "#" [^\n]* "\n")*