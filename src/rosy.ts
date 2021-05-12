import * as vscode from 'vscode'

// represents a uri which rosy wraps.
export type TargetURI = vscode.Uri;

// represents a uri which rosy exposes
export type RosyURI = vscode.Uri;

// represents an error rosifying or derosifying
export class RosyError extends Error {
    constructor(message: string) {
        super(message);
        this.name = "RosyError";
    }
}

export type Range = {
    start: number,
    end: number
}

// represents a rosy-transformed document at a single layer
export class RosyDocument {
    private content: string = "";

    ignoreRanges: Range[] = [];

    setContent(s: string) {
        this.content = s;
    }

    getContent(): string {
        return this.content;
    }
}

export interface Rosifier {
    rosify: (doc: RosyDocument) => RosyDocument
    derosify: (doc: RosyDocument) => RosyDocument
}

// a rosifier which comprises a sequence of rosifiers
export class RosySequence implements Rosifier {
    layers: Rosifier[];

    constructor(layers: Rosifier[] = []) {
        this.layers = layers;
    }

    rosify(doc: RosyDocument): RosyDocument {
        for (const layer of this.layers) {
            doc = layer.rosify(doc);
        }

        return doc;
    }

    derosify(doc: RosyDocument): RosyDocument {
        for (var i = this.layers.length; i --> 0;) {
            doc = this.layers[i].derosify(doc);
        }

        return doc;
    }
}