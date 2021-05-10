import * as vscode from 'vscode';

import { RosyFS } from './rosyfs'

export function activate(context: vscode.ExtensionContext) {

	var fs = new RosyFS()

	context.subscriptions.push(vscode.workspace.registerFileSystemProvider('rosy', fs, { isCaseSensitive: true }));

	context.subscriptions.push(vscode.commands.registerCommand('rosy.helloWorld', async () => {
		vscode.window.showInformationMessage('Hello World from rosy!');
		var uri: vscode.Uri = vscode.Uri.parse("rosy:/a.txt")
		var doc = await vscode.workspace.openTextDocument(uri)
	}));
}

export function deactivate() {}
