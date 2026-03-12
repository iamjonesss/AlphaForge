import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import { TemplateBuilder, TemplateStructure } from './backend/TemplateBuilder';

interface Template {
	name: string;
	description: string;
	structure: TemplateStructure;
	createdAt: string;
}

export class AlphaForgeProvider implements vscode.WebviewViewProvider {

	public static readonly viewType = 'alphaforge-view';

	private _view?: vscode.WebviewView;
	private templatesPath: string;

	constructor(
		private readonly _extensionUri: vscode.Uri,
	) {
		this.templatesPath = path.join(
			_extensionUri.fsPath,
			'templates'
		);

		if (!fs.existsSync(this.templatesPath)) {
			fs.mkdirSync(this.templatesPath, { recursive: true });
		}
	}

	public resolveWebviewView(
		webviewView: vscode.WebviewView,
		context: vscode.WebviewViewResolveContext,
		_token: vscode.CancellationToken,
	) {
		this._view = webviewView;

		webviewView.webview.options = {
			enableScripts: true,
			localResourceRoots: [
				vscode.Uri.joinPath(this._extensionUri, 'webview-ui')
			]
		};

		webviewView.webview.html = this._getHtmlForWebview(webviewView.webview);

		webviewView.webview.onDidReceiveMessage(async message => {
			switch (message.command) {
				case 'saveTemplate':
					await this.handleSaveTemplate(message.data);
					break;
				case 'getTemplates':
					await this.handleGetTemplates();
					break;
				case 'deleteTemplate':
					await this.handleDeleteTemplate(message.data.name);
					break;
				case 'selectFolder':
					await this.handleSelectFolder();
					break;
				case 'applyTemplate':
					await this.handleApplyTemplate(message.data);
					break;
				case 'showError':
					vscode.window.showErrorMessage(message.text);
					break;
				case 'showInfo':
					vscode.window.showInformationMessage(message.text);
					break;
			}
		});
	}

	private async handleSaveTemplate(data: { name: string; description: string; structure: TemplateStructure }) {
		try {
			const template: Template = {
				name: data.name,
				description: data.description,
				structure: data.structure,
				createdAt: new Date().toISOString()
			};

			const filePath = path.join(this.templatesPath, `${data.name}.json`);
			fs.writeFileSync(filePath, JSON.stringify(template, null, 2));

			this._view?.webview.postMessage({
				command: 'templateSaved'
			});

			vscode.window.showInformationMessage(`Template "${data.name}" salvo com sucesso!`);
		} catch (error) {
			vscode.window.showErrorMessage(`Erro ao salvar template: ${error}`);
		}
	}

	private async handleGetTemplates() {
		try {
			const files = fs.readdirSync(this.templatesPath);
			const templates: Template[] = [];

			for (const file of files) {
				if (file.endsWith('.json')) {
					const content = fs.readFileSync(path.join(this.templatesPath, file), 'utf8');
					templates.push(JSON.parse(content));
				}
			}

			this._view?.webview.postMessage({
				command: 'templatesList',
				data: templates
			});
		} catch (error) {
			vscode.window.showErrorMessage(`Erro ao carregar templates: ${error}`);
		}
	}

	private async handleDeleteTemplate(name: string) {
		try {
			const filePath = path.join(this.templatesPath, `${name}.json`);
			if (!fs.existsSync(filePath)) {
				vscode.window.showErrorMessage('Template não encontrado!');
				return;
			}

			// Mostrar confirmação antes de deletar
			const confirm = await vscode.window.showWarningMessage(
				`Tem certeza que deseja deletar o template "${name}"?`,
				{ modal: true },
				'Sim',
				'Não'
			);

			if (confirm !== 'Sim') {
				return;
			}

			fs.unlinkSync(filePath);
			
			this._view?.webview.postMessage({
				command: 'templateDeleted',
				data: { name }
			});
			
			vscode.window.showInformationMessage(`Template "${name}" deletado com sucesso!`);
			
			// Recarregar lista de templates
			await this.handleGetTemplates();
		} catch (error) {
			vscode.window.showErrorMessage(`Erro ao deletar template: ${error}`);
		}
	}

	private async handleSelectFolder() {
		const options: vscode.OpenDialogOptions = {
			canSelectMany: false,
			canSelectFiles: false,
			canSelectFolders: true,
			openLabel: 'Selecionar Pasta'
		};

		const folderUri = await vscode.window.showOpenDialog(options);
		
		if (folderUri && folderUri[0]) {
			this._view?.webview.postMessage({
				command: 'folderSelected',
				data: { path: folderUri[0].fsPath }
			});
		}
	}

	private async handleApplyTemplate(data: { templateName: string; targetPath: string }) {
		try {
			const templatePath = path.join(this.templatesPath, `${data.templateName}.json`);
			if (!fs.existsSync(templatePath)) {
				vscode.window.showErrorMessage('Template não encontrado!');
				return;
			}

			const templateContent = fs.readFileSync(templatePath, 'utf8');
			const template: Template = JSON.parse(templateContent);

			let targetPath = data.targetPath;
			
			if (!targetPath && vscode.workspace.workspaceFolders) {
				targetPath = vscode.workspace.workspaceFolders[0].uri.fsPath;
			}

			if (!targetPath) {
				vscode.window.showErrorMessage('Nenhuma pasta de destino selecionada!');
				return;
			}

			const confirm = await vscode.window.showWarningMessage(
				`Aplicar template "${template.name}" em:\n${targetPath}`,
				{ modal: true },
				'Sim',
				'Não'
			);

			if (confirm !== 'Sim') {
				return;
			}

			const builder = new TemplateBuilder(targetPath);
			builder.build(template.structure);

			this._view?.webview.postMessage({
				command: 'templateApplied',
				data: { path: targetPath }
			});

			vscode.window.showInformationMessage(`Template "${template.name}" aplicado com sucesso!`);
		} catch (error) {
			vscode.window.showErrorMessage(`Erro ao aplicar template: ${error}`);
		}
	}

	private _getHtmlForWebview(webview: vscode.Webview) {
		const scriptPath = vscode.Uri.joinPath(this._extensionUri, 'webview-ui', 'main.js');
		const stylesPath = vscode.Uri.joinPath(this._extensionUri, 'webview-ui', 'style.css');
		const htmlPath = vscode.Uri.joinPath(this._extensionUri, 'webview-ui', 'index.html');

		const scriptUri = webview.asWebviewUri(scriptPath);
		const stylesUri = webview.asWebviewUri(stylesPath);

		let htmlContent = fs.readFileSync(htmlPath.fsPath, 'utf8');

		htmlContent = htmlContent.replace(/{{cspSource}}/g, webview.cspSource)
			.replace(/{{stylesUri}}/g, stylesUri.toString())
			.replace(/{{scriptUri}}/g, scriptUri.toString());

		return htmlContent;
	}
}


export function activate(context: vscode.ExtensionContext) {

	const provider = new AlphaForgeProvider(context.extensionUri);

	context.subscriptions.push(
		vscode.window.registerWebviewViewProvider(AlphaForgeProvider.viewType, provider));
}

export function deactivate() { }