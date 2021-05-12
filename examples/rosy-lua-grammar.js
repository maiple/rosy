[
    {
       "type": "grammar",
       "name": "lua",
       "applies-to": [{
           "file": "*.lua"
        }],
        // see http://parrot.github.io/parrot-docs0/0.4.7/html/languages/lua/doc/lua51.bnf.html
        "grammar": `
        # X*   implicitly generates rules X* -> ~; X* -> X X*
        # X*%~ implicitly generates rules X* -> ~; X* -> X %~ X*
        # X+   implicitly generates rules X+ -> X; X+ -> X X+
        # X+%~ implicitly generates rules X+ -> X; X+ -> X %~ X+
        # X?   implicitly generates rules X? -> ~; X? -> X 
        # ~X -> B removes rule X -> B
        # A:(...) is replaced with A and implicitly generates rule A -> ...
        # @ is the start symbol
        # % represents optional whitespace, and by default the following rules exist:
        # 'X' matches terminal/literal unquoted 'X'
        # "X" is the same but matches only if X is surrounded by word boundaries
        # (if word characters at respective edges of X).
        
        @start -> % chunk
        block -> chunk
        chunk -> stat_semi:(stat semi?)* laststat_semi:(laststat semi?)?
        semi -> ';'

        stat -> varlist1 '=' explist1
        stat -> functioncall
        stat -> "do" block "end"
        stat -> "while" exp "do" block "end"
        stat -> "repeat" block "until" exp
        stat -> "if" exp "then" block elseifstat* elsestat? 'end'
        stat -> "for" name '=' explist1 "do" block "end"
        stat -> "function" funcname funcbody
        stat -> "local" "function" name funcbody
        stat -> "local" namelist1 '=' explist1
        stat -> "local" namelist1 

        laststat -> "return" explist
        laststat -> break

        explist -> explist1?
        explist1 -> exp ',' explist1
        explist1 -> exp

        elseifstat -> "elseif" exp "then" block
        elsestat -> "else" block

        funcname -> namedots colname?
        namedots1 -> name '.' namedots1
        namedots1 -> name
        colname -> ':' name

        varlist -> varlist1
        varlist1 -> var ',' varlist1
        varlist1 -> var

        var -> name
        var -> arraylv:(prefixexp '[' exp ']')
        var -> dotlv:(prefixexp '.' name)

        namelist -> namelist1?
        namelist1 -> name ',' namelist1
        namelist1 -> name

        exp -> "nil"
        exp -> "false"
        exp -> "true"
        exp -> number
        exp -> string
        exp -> '...'
        exp -> function
        exp -> prefixexp
        exp -> table_literal

        # TODO: these operators
        exp -> binexp
        exp -> unexp

        prefixexp -> var
        prefixexp -> functioncall
        prefixexp -> parenexp:('(' exp ')')

        functioncall -> prefixexp args
        functioncall -> prefixexp ':' name args

        args -> '(' explist ')'
        args -> table_lit
        args -> string

        function -> "function" funcbody
        funcbody -> '(' parlist ')' block "end"
        
        parlist -> parlist1?
        parlist1 -> '...'
        parlist1 -> namelist ',' '...'
        parlist1 -> namelist

        table_lit -> '{' fieldlist fieldsep? '}'

        fieldlist -> field fieldsep fieldlist
        fieldlist -> field

        field -> '[' exp ']' '=' exp
        field -> name '=' exp
        field -> exp

        fieldsep -> ','
        fieldsep -> ';'

        number -> [0-9]* '.'? [0-9]+
        number -> '0x' [0-9a-fA-F]+


        # strings ---------------
        string -> '\\'' %~ qstring %~ '\\''
        string -> '"' %~ qqstring %~ '"'
        string -> '[[' %~ lstring %~ ']]'

        qstring  -> qstringc*%~
        qstringc -> ']]'
        qstringc -> '"'
        qstringc -> nstringc

        qqstring  -> qqstringc*%~
        qqstringc -> '''
        qqstringc -> ']]'
        qqstringc -> nstringc

        # TODO: lstring

        nstringc -> escc
        nstringc -> [^"']

        # escape characters
        escc -> '\\a'
        escc -> '\\b'
        escc -> '\\f'
        escc -> '\\n'
        escc -> '\\r'
        escc -> '\\t'
        escc -> '\\v'
        escc -> '\\\\'
        escc -> '\\"'
        escc -> '\\\''
        escc -> '\\['
        escc -> '\\]'
       `
    }
]