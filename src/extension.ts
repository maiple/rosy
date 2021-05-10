import * as vscode from 'vscode';

import { RosyFS } from './rosyfs'

export function activate(context: vscode.ExtensionContext) {

	var fs = new RosyFS()

	context.subscriptions.push(vscode.workspace.registerFileSystemProvider('rosy', fs, { isCaseSensitive: true }));

	context.subscriptions.push(vscode.commands.registerCommand('rosy.view', async () => {
		if (vscode.window.activeTextEditor === undefined)
		{
			vscode.window.showErrorMessage('No active file for viewing.');
		}
		else
		{
			var uri: vscode.Uri = vscode.window.activeTextEditor.document.uri
			vscode.window.showInformationMessage('Viewing file in Rosy: ' + uri.toString());
			try
			{
				var rosyuri = RosyFS.toRosyURI(uri)
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
