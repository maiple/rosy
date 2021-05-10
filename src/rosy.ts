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