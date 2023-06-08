import { assert } from "console";
import { Rosifier, RosyDocument } from "./rosy";

let parser = require("./rosy-cfg-grammar");

export class RosifierCFG implements Rosifier {
    name: string;
    constructor(data: any) {
        assert(data.type && data.type === "grammar");
        this.name = data.name;
    }
    rosify (doc: RosyDocument): RosyDocument {
        return doc;
    }
    derosify (doc: RosyDocument): RosyDocument {
        return doc;
    }
}

export function rosyParseTest() {
    try
    {
        return parser.parse(`A -> hello; hello -> 'hello' A? hello* z`)[1];
    } catch (e) {
        return `error: ${e}`;
    }
}

// main
if (require && require.main === module)
{
    console.log(rosyParseTest())
}
