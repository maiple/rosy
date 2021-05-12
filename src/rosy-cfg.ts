import { Rosifier, RosyDocument } from "./rosy";

let parser = require("./rosy-cfg-grammar");

export function rosyParseTest() {
    try
    {
        return parser.parse(`5+3`);
    } catch (e) {
        return `error: ${e}`
    }
}

export class RosifierCFG implements Rosifier {
    rosify (doc: RosyDocument): RosyDocument {
        return doc;
    }
    derosify (doc: RosyDocument): RosyDocument {
        return doc;
    }

}