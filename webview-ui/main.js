// Este script roda dentro do WebView
(function () {
    const vscode = acquireVsCodeApi();

    // Estado local
    let templates = [];
    let selectedTemplate = null;
    let targetFolderPath = '';

    // Elementos DOM
    const templateName = document.getElementById('templateName');
    const templateDescription = document.getElementById('templateDescription');
    const templateStructure = document.getElementById('templateStructure');
    const saveTemplateBtn = document.getElementById('saveTemplateBtn');
    const templatesList = document.getElementById('templatesList');
    const selectFolderBtn = document.getElementById('selectFolderBtn');
    const targetFolder = document.getElementById('targetFolder');
    const applyTemplateBtn = document.getElementById('applyTemplateBtn');

    // Event Listeners
    saveTemplateBtn.addEventListener('click', handleSaveTemplate);
    selectFolderBtn.addEventListener('click', handleSelectFolder);
    applyTemplateBtn.addEventListener('click', handleApplyTemplate);

    // Carregar templates ao iniciar
    loadTemplates();

    // Função: Salvar Template
    function handleSaveTemplate() {
        const name = templateName.value.trim();
        const description = templateDescription.value.trim();
        const structure = templateStructure.value.trim();

        if (!name) {
            showError('Por favor, insira um nome para o template.');
            return;
        }

        if (!structure) {
            showError('Por favor, defina a estrutura do template.');
            return;
        }

        // Validar JSON
        let parsedStructure;
        try {
            parsedStructure = JSON.parse(structure);
        } catch (e) {
            showError('Estrutura JSON inválida: ' + e.message);
            return;
        }

        // Enviar para o backend
        vscode.postMessage({
            command: 'saveTemplate',
            data: {
                name,
                description,
                structure: parsedStructure
            }
        });
    }

    // Função: Selecionar Pasta
    function handleSelectFolder() {
        vscode.postMessage({
            command: 'selectFolder'
        });
    }

    // Função: Aplicar Template
    function handleApplyTemplate() {
        if (!selectedTemplate) {
            showError('Por favor, selecione um template primeiro.');
            return;
        }

        vscode.postMessage({
            command: 'applyTemplate',
            data: {
                templateName: selectedTemplate.name,
                targetPath: targetFolderPath
            }
        });
    }

    // Função: Carregar Templates
    function loadTemplates() {
        vscode.postMessage({
            command: 'getTemplates'
        });
    }

    // Função: Renderizar lista de templates
    function renderTemplates(templatesData) {
        templates = templatesData;

        if (templates.length === 0) {
            templatesList.innerHTML = '<p class="empty-state">Nenhum template salvo ainda. Crie seu primeiro template acima!</p>';
            return;
        }

        templatesList.innerHTML = templates.map(template => `
            <div class="template-card" data-name="${template.name}">
                <div class="template-header">
                    <h3>📦 ${template.name}</h3>
                    <div class="template-actions">
                        <button class="btn-icon btn-select" title="Selecionar">✓</button>
                        <button class="btn-icon btn-delete" title="Deletar">🗑️</button>
                    </div>
                </div>
                <p class="template-description">${template.description || 'Sem descrição'}</p>
                <small class="template-date">Criado em: ${new Date(template.createdAt).toLocaleDateString('pt-BR')}</small>
            </div>
        `).join('');

        // Adicionar event listeners nos botões
        templatesList.querySelectorAll('.btn-select').forEach((btn, index) => {
            btn.addEventListener('click', () => selectTemplate(templates[index]));
        });

        templatesList.querySelectorAll('.btn-delete').forEach((btn, index) => {
            btn.addEventListener('click', () => deleteTemplate(templates[index].name));
        });
    }

    // Função: Selecionar Template
    function selectTemplate(template) {
        selectedTemplate = template;
        
        // Highlight visual
        templatesList.querySelectorAll('.template-card').forEach(card => {
            card.classList.remove('selected');
        });
        const selectedCard = templatesList.querySelector(`[data-name="${template.name}"]`);
        if (selectedCard) {
            selectedCard.classList.add('selected');
        }

        // Habilitar botão de aplicar
        applyTemplateBtn.disabled = false;
        
        showSuccess(`Template "${template.name}" selecionado!`);
    }

    // Função: Deletar Template
    function deleteTemplate(name) {
        if (confirm(`Tem certeza que deseja deletar o template "${name}"?`)) {
            vscode.postMessage({
                command: 'deleteTemplate',
                data: { name }
            });
        }
    }

    // Função: Mostrar erro
    function showError(message) {
        vscode.postMessage({
            command: 'showError',
            text: message
        });
    }

    // Função: Mostrar sucesso
    function showSuccess(message) {
        vscode.postMessage({
            command: 'showInfo',
            text: message
        });
    }

    // Receber mensagens do backend
    window.addEventListener('message', event => {
        const message = event.data;

        switch (message.command) {
            case 'templatesList':
                renderTemplates(message.data);
                break;

            case 'templateSaved':
                showSuccess('Template salvo com sucesso!');
                // Limpar formulário
                templateName.value = '';
                templateDescription.value = '';
                templateStructure.value = '';
                // Recarregar lista
                loadTemplates();
                break;

            case 'templateDeleted':
                showSuccess('Template deletado com sucesso!');
                if (selectedTemplate && selectedTemplate.name === message.data.name) {
                    selectedTemplate = null;
                    applyTemplateBtn.disabled = true;
                }
                loadTemplates();
                break;

            case 'folderSelected':
                targetFolderPath = message.data.path;
                targetFolder.value = message.data.path;
                break;

            case 'templateApplied':
                showSuccess(`Template aplicado com sucesso em: ${message.data.path}`);
                break;
        }
    });
}());