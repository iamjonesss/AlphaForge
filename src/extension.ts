import * as vscode from 'vscode';

export function activate(context: vscode.ExtensionContext) {

	console.log('Congratulations, your extension "alphaforge" is now active!');

	const disposable = vscode.commands.registerCommand('alphaforge.helloWorld', () => {

		vscode.window.showInformationMessage('Hello World from AlphaForge!');
	});

	context.subscriptions.push(disposable);
}

export function deactivate() {}
