(function () {
    const root = window.AlphaForge || (window.AlphaForge = {});

    class VSCodeMessenger {
        constructor() {
            this.vscode = acquireVsCodeApi();
        }

        post(command, data) {
            this.vscode.postMessage({ command, data });
        }

        showError(text) {
            this.vscode.postMessage({ command: 'showError', text });
        }

        showInfo(text) {
            this.vscode.postMessage({ command: 'showInfo', text });
        }

        onMessage(handler) {
            window.addEventListener('message', (event) => handler(event.data));
        }
    }

    root.VSCodeMessenger = VSCodeMessenger;
}());