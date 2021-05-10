import * as path from 'path';
import * as vscode from 'vscode';

var g_mtime = 1

export class RosyFS implements vscode.FileSystemProvider {
    stat(uri: vscode.Uri): vscode.FileStat {
        vscode.window.showInformationMessage('Rosy stat: ' + uri.toString());
        return {
            type: vscode.FileType.File,
            ctime: 1,
            mtime: g_mtime,
            size: 1,
        }
    }

    readDirectory(uri: vscode.Uri): [string, vscode.FileType][] {
        vscode.window.showInformationMessage('Rosy read directory: ' + uri.toString());
        return []
    }

    readFile(uri: vscode.Uri): Uint8Array {
        vscode.window.showInformationMessage('Rosy read file: ' + uri.toString());
        return Buffer.from("A", 'utf8');
    }

    writeFile(uri: vscode.Uri, content: Uint8Array, options: { create: boolean, overwrite: boolean }):void {
        // do nothing for now.
    }

    rename(oldUri: vscode.Uri, newUri: vscode.Uri, options: { overwrite: boolean }): void {
        // do nothing for now.
    }

    delete(uri: vscode.Uri): void {
        // do nothing for now
    }

    createDirectory(uri: vscode.Uri): void {
        // do nothing for now
    }

    private _emitter = new vscode.EventEmitter<vscode.FileChangeEvent[]>()
    readonly onDidChangeFile: vscode.Event<vscode.FileChangeEvent[]> = this._emitter.event

    watch(uri: vscode.Uri, options: {excludes: string[], recursive: boolean}): vscode.Disposable {
        // ignore, fires for all changes...
        return new vscode.Disposable(() => { });
    }
}