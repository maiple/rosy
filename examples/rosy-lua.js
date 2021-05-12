[
    {
        "type": "lua",
        "rules": [
            {
                "rule": `
                    @ stat -> 'do' block 'end'

                    #  - to go before, + to come after
                    + stat -> '{' block '}'
                `,
                "condition": null
            }
        ]
    }
]