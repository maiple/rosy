[
    {
       "type": "grammar",
       "name": "%",
       "grammar": `

        # optional whitespace
        % -> %%?        # any whitespace
        %s -> %space?   # whitespace without newline
        %~ -> ~         # no whitespace (do not insert whitespace automatically between two tokens)
        %b ->           # word boundary

        # types of whitespace
        %% -> %space
        %% -> %newline
        %% -> %padded_newline+ %space?
        %% -> %padded_comment

        %space -> ' ' %space?
        %space -> '\t' %space?

        %padded_newline -> %space? %newline

        %newline -> %stdnewline
        %newline -> %altnewline

        %stdnewline -> %%PLATFORM_NEWLINE%%
        %stdnewline -> '\n'
        %stdnewline -> '\r\n'

        %altnewline -> '\r'
        %altnewline -> '\f'
        %altnewline -> '\v'

        %padded_comment -> %%? %comment %%?
       `
    }
]