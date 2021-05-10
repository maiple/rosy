import * as vscode from 'vscode';

import { RosyFS } from './rosyfs'

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

function rosify(a: Uint8Array): Uint8Array {
	return a.map(swapCase)
}

function derosify(a: Uint8Array): Uint8Array {
	return a.map(swapCase)
}

export function activate(context: vscode.ExtensionContext) {

	var fs = new RosyFS(rosify, derosify)

	fs.onDidChangeFile((e: vscode.FileChangeEvent[]) => {
		console.log(msg)
	})

	context.subscriptions.push(vscode.workspace.registerFileSystemProvider('rosy', fs, { isCaseSensitive: true }));

	context.subscriptions.push(vscode.commands.registerCommand('rosy.view', async () => {
		if (vscode.window.activeTextEditor === undefined)
		{
			vscode.window.showErrorMessage('No active file for viewing.');
		}
		else
		{
			var uri: vscode.Uri = vscode.window.activeTextEditor.document.uri
			if (uri.scheme == "rosy")
			{
				// there's nothing *technically* stopping us from recursively rosying a file
				// but the user most likely doesn't desire this, and even if they do, it's perhaps better
				// not to allow because there isn't very much affordance, and maybe this could cause some weird bugs...?
				vscode.window.showInformationMessage('File already open in Rosy');
			}
			else try
			{
				var rosyuri = RosyFS.toRosyUri(uri)
				vscode.window.showInformationMessage('Viewing file: ' + rosyuri.toString());
				var doc = await vscode.workspace.openTextDocument(rosyuri)
				vscode.window.showTextDocument(doc)
			}
			catch (e)
			{
				vscode.window.showErrorMessage(`Could not open file: ${e.toString()}`);
			}
		}
	}));
}

export function deactivate() {}
