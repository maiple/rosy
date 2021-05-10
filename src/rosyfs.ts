import { fstat } from 'fs';
import * as path from 'path';
import * as vscode from 'vscode';
import { RosyError } from './rosy';

// represents a uri which rosy wraps.
export type TargetURI = vscode.Uri

// represents a uri which rosy exposes
export type RosyURI = vscode.Uri

// helper functions ------------------------------------------------
function checkSchemeNonEmpty(uri: vscode.Uri) {
    if (uri.scheme.length == 0)
    {
        throw new vscode.FileSystemError(`uri scheme empty; "file:" expected if nothing else.`)
    }
}

// we use tilde as an escape character.
const SCHEME_DELIMETER = "~-"

function sanitizeURIComponent(s: string): string {
    return s.replace("~", "~-")
}

function desanitizeURIComponent(s: string): string {
    return s.replace("~-", "~")
}
// -----------------------------------------------------------------

/*
    This class handles mapping the "rosy" file to the underlying actual file and vice versa.
    It is given two functions to convert from and to rosified versions, but otherwise has no understanding
    of the actual rosy file transformation that occurs.
*/
export class RosyFS implements vscode.FileSystemProvider {
    constructor(rosify: (a: Uint8Array) => Uint8Array, derosify: (a: Uint8Array) => Uint8Array) {
        this.rosify = rosify
        this.derosify = derosify
    }

    stat(uri: RosyURI): vscode.FileStat | Thenable<vscode.FileStat> {
        var targetUri = this.getTargetURI(uri)
        var fs = this.getTargetFilesystemProvider(targetUri)
        return fs.stat(targetUri)
    }

    readDirectory(uri: RosyURI): [string, vscode.FileType][] | Thenable<[string, vscode.FileType][]> {
        var targetUri = this.getTargetURI(uri)
        var fs = this.getTargetFilesystemProvider(targetUri)
        return fs.readDirectory(targetUri)
    }

    async readFile(uri: RosyURI): Promise<Uint8Array> {
        var targetUri = this.getTargetURI(uri)
        var fs = this.getTargetFilesystemProvider(targetUri)
        var content = await fs.readFile(targetUri)
        return this.rosify(content)
    }

    writeFile(uri: RosyURI, content: Uint8Array, options: { create: boolean, overwrite: boolean }): void | Thenable<void> {
        var targetUri = this.getTargetURI(uri)
        var fs = this.getTargetFilesystemProvider(targetUri)
        return fs.writeFile(targetUri, this.derosify(content), options)
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
            throw new vscode.FileSystemError("cannot rename from one filesystem to another")
        }
    }

    delete(uri: RosyURI, options: {recursive: boolean}): void | Thenable<void>  {
        var targetUri = this.getTargetURI(uri)
        var fs = this.getTargetFilesystemProvider(targetUri)
        return fs.delete(targetUri, options)
    }

    createDirectory(uri: RosyURI): void | Thenable<void>  {
        var targetUri = this.getTargetURI(uri)
        var fs = this.getTargetFilesystemProvider(targetUri)
        return fs.createDirectory(targetUri)
    }

    watch(uri: RosyURI, options: {excludes: string[], recursive: boolean} = {excludes: [], recursive: false}): vscode.Disposable {
        const targetUri: TargetURI = this.getTargetURI(uri)
        checkSchemeNonEmpty(targetUri)

        // what to watch?
        // VSCode seems to be very particular about the exact way paths are specified
        // with respect to workspaces when watching, so we have to go through hoops here...
        const globs: (string | vscode.RelativePattern)[] = []
        {
            // re-express path relative to a workspace folder if possible (required for watching...)
            var workspaceFolder: vscode.WorkspaceFolder | undefined = vscode.workspace.getWorkspaceFolder(targetUri)

            if (workspaceFolder !== undefined)
            {
                // use a RelativePattern relative to the workspace.
                var relpath: string = path.relative(workspaceFolder.uri.path, targetUri.path)
                globs.push(new vscode.RelativePattern(workspaceFolder, relpath))

                // also add /path/** version if recursive
                if (options.recursive)
                {
                    // TODO: check that this is a folder (and hence can be recursed upon)
                    try
                    {
                        globs.push(new vscode.RelativePattern(workspaceFolder, path.join(relpath, "**")))
                    }
                    // fail silently for now...
                    // FIXME: do better.
                    catch {}
                }
            }
            else
            {
                // just use the absolute path (note that this might not actually work...)
                var strippedUri =
                    ((targetUri.scheme && targetUri.scheme != "file") || targetUri.authority)
                        ? `${targetUri.scheme}://${targetUri.authority}${targetUri.path}` // match exactly the target URI
                        : path.resolve(targetUri.path)
                globs.push(strippedUri)
                if (options.recursive)
                {
                    // TODO: check that this is a folder (and hence can be recursed upon)
                    try
                    {
                        globs.push(new vscode.RelativePattern(strippedUri, "**"))
                    }
                    // fail silently for now...
                    // FIXME: do better.
                    catch {}
                }
            }
        }

        // create a watcher for the file, and if recursive, a watcher for the subfiles as well.
        // TODO: use 'excludes' here...
        const watchers: vscode.FileSystemWatcher[] = []
        for (const glob of globs)
        {
            watchers.push(vscode.workspace.createFileSystemWatcher(glob, false, false, false))
        }

        const fireRosyUri = (type: vscode.FileChangeType, targetUri: TargetURI) => {
            var uri: RosyURI = RosyFS.toRosyUri(targetUri)
            var event: vscode.FileChangeEvent = {type, uri}
            this._emitter.fire([event])
        }

        // when the watcher reports an event, we fire that event.
        for (const watcher of watchers) {
            watcher.onDidChange(uri => fireRosyUri(vscode.FileChangeType.Changed, uri))
            watcher.onDidCreate(uri => fireRosyUri(vscode.FileChangeType.Created, uri))
            watcher.onDidDelete(uri => fireRosyUri(vscode.FileChangeType.Deleted, uri))
        }

        // dispose the watchers.
        return new vscode.Disposable(() => {
            for (const watcher of watchers) {
                watcher.dispose()
            }
        });
    }
    
    private rosify: (a: Uint8Array) => Uint8Array
    private derosify: (a: Uint8Array) => Uint8Array
    private _emitter = new vscode.EventEmitter<vscode.FileChangeEvent[]>()
    readonly onDidChangeFile: vscode.Event<vscode.FileChangeEvent[]> = this._emitter.event

    private getTargetFilesystemProvider(uri: TargetURI): vscode.FileSystemProvider | vscode.FileSystem {
        checkSchemeNonEmpty(uri)
        if (uri.scheme == "file")
        {
            return vscode.workspace.fs
        }
        else
        {
            throw new vscode.FileSystemError(`cannot get filesystem provider for scheme ${uri.scheme}`)
        }
    }

    static toRosyUri(uri: TargetURI): RosyURI {
        let s = "rosy://"
        checkSchemeNonEmpty(uri)
        if (uri.scheme == "rosy")
        {
            // prevent recursion.
            // this ought not technically to be illegal, but we're catching bugs like this...
            throw new vscode.FileSystemError("already a Rosy URI")
        }
        // tilde separates wrapped scheme from wrapped authority
        s += sanitizeURIComponent(uri.scheme) + SCHEME_DELIMETER
        if (uri.authority) s += sanitizeURIComponent(uri.authority)
        if (uri.path) s += sanitizeURIComponent(uri.path)
        if (uri.query) s += "?" + sanitizeURIComponent(uri.query)
        if (uri.fragment) s += "#" + sanitizeURIComponent(uri.fragment)
        return vscode.Uri.parse(s)
    }

    // all rosy files wrap a target uri
    // rosy:/scheme/path
    private getTargetURI(uri: RosyURI): TargetURI {
        if (uri.scheme != "rosy")
        {
            throw new vscode.FileSystemError(`scheme expected to be "rosy:", but instead was "${uri.scheme}"`)
        }

        // desanitize. It is now safe to 
        let path = desanitizeURIComponent(uri.path)
        {
            let s = ""
            if (uri.authority.length == 0)
            {
                s = "file://"
            }
            else
            {
                // find tilde; this marks the wrapped scheme
                var n = uri.authority.search(SCHEME_DELIMETER)
                if (n < 0)
                {
                    s = "https://" + desanitizeURIComponent(uri.authority)
                }
                else
                {
                    let scheme = desanitizeURIComponent(uri.authority.substring(0, n))
                    if (scheme.length == 0)
                    {
                        scheme = "https"
                    }
                    let auth = desanitizeURIComponent(uri.authority.substring(n + SCHEME_DELIMETER.length))
                    s = scheme + "://" + auth
                }
            }

            s += path
            if (uri.query.length > 0)
            {
                s += "?" + desanitizeURIComponent(uri.query)
            }
            if (uri.fragment.length > 0)
            {
                s += "#" + desanitizeURIComponent(uri.query)
            }
            var uri = vscode.Uri.parse(s)
            checkSchemeNonEmpty(uri) // error checking
            return uri
        }
    }
}