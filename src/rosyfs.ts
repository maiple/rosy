import { fstat } from 'fs';
import * as path from 'path';
import * as vscode from 'vscode';

var g_mtime = 1

// represents a uri which rosy wraps.
type TargetURI = vscode.Uri

// represents a uri which rosy exposes
type RosyURI = vscode.Uri

function swapCase(ord: number) {
    if (ord >= 65 && ord <= 90)
    {
        return ord + 97 - 65
    }

    if (ord >= 97 && ord <= 122)
    {
        return ord + 65 - 97
    }

    return ord
}

export class RosyFS implements vscode.FileSystemProvider {
    stat(uri: RosyURI): vscode.FileStat | Thenable<vscode.FileStat> {
        var targetURI = this.getTargetURI(uri)
        var fs = this.getTargetFilesystemProvider(targetURI)
        return fs.stat(targetURI)
    }

    readDirectory(uri: RosyURI): [string, vscode.FileType][] | Thenable<[string, vscode.FileType][]> {
        var targetURI = this.getTargetURI(uri)
        var fs = this.getTargetFilesystemProvider(targetURI)
        return fs.readDirectory(targetURI)
    }

    async readFile(uri: RosyURI): Promise<Uint8Array> {
        var targetURI = this.getTargetURI(uri)
        var fs = this.getTargetFilesystemProvider(targetURI)
        var content = await fs.readFile(targetURI)
        return content.map(swapCase)
    }

    writeFile(uri: RosyURI, content: Uint8Array, options: { create: boolean, overwrite: boolean }): void | Thenable<void> {
        var targetURI = this.getTargetURI(uri)
        var fs = this.getTargetFilesystemProvider(targetURI)
        return fs.writeFile(targetURI, content.map(swapCase), options)
    }

    rename(oldUri: RosyURI, newUri: RosyURI, options: { overwrite: boolean }): void | Thenable<void> {
        var oldTargetURI = this.getTargetURI(oldUri)
        var newTargetURI = this.getTargetURI(newUri)
        var fs = this.getTargetFilesystemProvider(oldTargetURI)
        var fs2 = this.getTargetFilesystemProvider(newTargetURI)
        if (fs === fs2)
        {
            return fs.rename(oldTargetURI, newTargetURI, options)
        }
        else
        {
            throw "cannot rename from one filesystem to another"
        }
    }

    delete(uri: RosyURI, options: {recursive: boolean}): void | Thenable<void>  {
        var targetURI = this.getTargetURI(uri)
        var fs = this.getTargetFilesystemProvider(targetURI)
        return fs.delete(targetURI, options)
    }

    createDirectory(uri: RosyURI): void | Thenable<void>  {
        var targetURI = this.getTargetURI(uri)
        var fs = this.getTargetFilesystemProvider(targetURI)
        return fs.createDirectory(targetURI)
    }

    private _emitter = new vscode.EventEmitter<vscode.FileChangeEvent[]>()
    readonly onDidChangeFile: vscode.Event<vscode.FileChangeEvent[]> = this._emitter.event // TODO

    watch(uri: RosyURI, options: {excludes: string[], recursive: boolean}): vscode.Disposable {
        // ignore, fires for all changes...
        return new vscode.Disposable(() => { });
    }

    private getTargetFilesystemProvider(uri: TargetURI): vscode.FileSystemProvider | vscode.FileSystem {
        if (uri.scheme == "file" || uri.scheme.length == 0)
        {
            return vscode.workspace.fs
        }
        else
        {
            throw `cannot get filesystem provider for scheme ${uri.scheme}`
        }
    }

    static toRosyURI(uri: TargetURI): RosyURI {
        let s = "rosy://"
        // tilde separates wrapped scheme from wrapped authority
        if (uri.scheme)
        {
            s += uri.scheme + "~"
        }
        else
        {
            s += "file~"
        }
        if (uri.authority) s += uri.authority
        if (uri.path) s += uri.path.replace("%", "%25").replace("#", "%23").replace("?", "%3F") // sanitize
        if (uri.query) s += "?" + uri.query
        if (uri.fragment) s += "#" + uri.fragment
        return vscode.Uri.parse(s)
    }

    // all rosy files wrap a target uri
    // rosy:/scheme/path
    private getTargetURI(uri: RosyURI): TargetURI {
        // assert uri.scheme == "rosy"
        let path = uri.path.replace("%3F", "?").replace("%23", "#").replace("%25", "%") // desanitize
        if (uri.authority.length == 0 && uri.query.length == 0 && uri.fragment.length == 0)
        {
            return vscode.Uri.file(path)
        }
        else
        {
            let s = ""
            if (uri.authority.length == 0)
            {
                s = "file://"
            }
            else
            {
                // find tilde; this marks the wrapped scheme
                var n = uri.authority.search("~")
                if (n < 0)
                {
                    s = "https://" + uri.authority
                }
                else
                {
                    let scheme = uri.authority.substring(0, n)
                    if (scheme.length == 0)
                    {
                        scheme = "https"
                    }
                    let auth = uri.authority.substring(n + 1)
                    s = scheme + "://" + auth
                }
            }

            s += path
            if (uri.query.length > 0)
            {
                s += "?" + uri.query
            }
            if (uri.fragment.length > 0)
            {
                s += "#" + uri.query
            }
            return vscode.Uri.parse(s)
        }
    }
}