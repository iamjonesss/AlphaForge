"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.AlphaForgeProvider = void 0;
exports.activate = activate;
exports.deactivate = deactivate;
const vscode = __importStar(require("vscode"));
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const TemplateBuilder_1 = require("./backend/TemplateBuilder");
class AlphaForgeProvider {
    _extensionUri;
    static viewType = 'alphaforge-view';
    _view;
    templatesPath;
    constructor(_extensionUri) {
        this._extensionUri = _extensionUri;
        this.templatesPath = path.join(_extensionUri.fsPath, 'templates');
        if (!fs.existsSync(this.templatesPath)) {
            fs.mkdirSync(this.templatesPath, { recursive: true });
        }
    }
    resolveWebviewView(webviewView, context, _token) {
        this._view = webviewView;
        webviewView.webview.options = {
            enableScripts: true,
            localResourceRoots: [
                vscode.Uri.joinPath(this._extensionUri, 'webview-ui')
            ]
        };
        webviewView.webview.html = this._getHtmlForWebview(webviewView.webview);
        webviewView.webview.onDidReceiveMessage(async (message) => {
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
    async handleSaveTemplate(data) {
        try {
            const template = {
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
        }
        catch (error) {
            vscode.window.showErrorMessage(`Erro ao salvar template: ${error}`);
        }
    }
    async handleGetTemplates() {
        try {
            const files = fs.readdirSync(this.templatesPath);
            const templates = [];
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
        }
        catch (error) {
            vscode.window.showErrorMessage(`Erro ao carregar templates: ${error}`);
        }
    }
    async handleDeleteTemplate(name) {
        try {
            const filePath = path.join(this.templatesPath, `${name}.json`);
            if (fs.existsSync(filePath)) {
                fs.unlinkSync(filePath);
                this._view?.webview.postMessage({
                    command: 'templateDeleted',
                    data: { name }
                });
                vscode.window.showInformationMessage(`Template "${name}" deletado com sucesso!`);
            }
        }
        catch (error) {
            vscode.window.showErrorMessage(`Erro ao deletar template: ${error}`);
        }
    }
    async handleSelectFolder() {
        const options = {
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
    async handleApplyTemplate(data) {
        try {
            const templatePath = path.join(this.templatesPath, `${data.templateName}.json`);
            if (!fs.existsSync(templatePath)) {
                vscode.window.showErrorMessage('Template não encontrado!');
                return;
            }
            const templateContent = fs.readFileSync(templatePath, 'utf8');
            const template = JSON.parse(templateContent);
            let targetPath = data.targetPath;
            if (!targetPath && vscode.workspace.workspaceFolders) {
                targetPath = vscode.workspace.workspaceFolders[0].uri.fsPath;
            }
            if (!targetPath) {
                vscode.window.showErrorMessage('Nenhuma pasta de destino selecionada!');
                return;
            }
            const confirm = await vscode.window.showWarningMessage(`Aplicar template "${template.name}" em:\n${targetPath}`, { modal: true }, 'Sim', 'Não');
            if (confirm !== 'Sim') {
                return;
            }
            const builder = new TemplateBuilder_1.TemplateBuilder(targetPath);
            builder.build(template.structure);
            this._view?.webview.postMessage({
                command: 'templateApplied',
                data: { path: targetPath }
            });
            vscode.window.showInformationMessage(`Template "${template.name}" aplicado com sucesso!`);
        }
        catch (error) {
            vscode.window.showErrorMessage(`Erro ao aplicar template: ${error}`);
        }
    }
    _getHtmlForWebview(webview) {
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
exports.AlphaForgeProvider = AlphaForgeProvider;
function activate(context) {
    const provider = new AlphaForgeProvider(context.extensionUri);
    context.subscriptions.push(vscode.window.registerWebviewViewProvider(AlphaForgeProvider.viewType, provider));
}
function deactivate() { }
//# sourceMappingURL=extension.js.map