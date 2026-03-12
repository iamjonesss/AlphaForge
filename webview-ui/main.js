// Este script roda dentro do WebView
(function () {
    const vscode = acquireVsCodeApi();

    // Estado local
    let templates = [];
    let selectedTemplate = null;
    let targetFolderPath = '';
    let structureItems = []; // Array para armazenar a estrutura do projeto
    let itemIdCounter = 0; // Contador para IDs únicos

    // Elementos DOM
    const templateName = document.getElementById('templateName');
    const templateDescription = document.getElementById('templateDescription');
    const saveTemplateBtn = document.getElementById('saveTemplateBtn');
    const templatesList = document.getElementById('templatesList');
    const selectFolderBtn = document.getElementById('selectFolderBtn');
    const targetFolder = document.getElementById('targetFolder');
    const applyTemplateBtn = document.getElementById('applyTemplateBtn');
    const addFolderBtn = document.getElementById('addFolderBtn');
    const addFileBtn = document.getElementById('addFileBtn');
    const structureTree = document.getElementById('structureTree');

    // Event Listeners
    saveTemplateBtn.addEventListener('click', handleSaveTemplate);
    selectFolderBtn.addEventListener('click', handleSelectFolder);
    applyTemplateBtn.addEventListener('click', handleApplyTemplate);
    addFolderBtn.addEventListener('click', () => handleAddItem('folder'));
    addFileBtn.addEventListener('click', () => handleAddItem('file'));

    // Carregar templates ao iniciar
    loadTemplates();

    // Função: Adicionar Item
    function handleAddItem(type) {
        const item = {
            id: itemIdCounter++,
            type: type, // 'folder' ou 'file'
            name: '',
            content: type === 'file' ? '' : null,
            parent: null, // ID do pai (null = raiz)
            expanded: true
        };
        structureItems.push(item);
        renderStructureTree();
    }

    // Função: Renderizar Árvore de Estrutura
    function renderStructureTree() {
        if (structureItems.length === 0) {
            structureTree.innerHTML = '<div class="empty-structure">Clique nos botões acima para adicionar pastas e arquivos</div>';
            return;
        }

        const rootItems = structureItems.filter(item => item.parent === null);
        
        structureTree.innerHTML = rootItems.map(item => renderTreeItem(item, 0)).join('');
        
        // Adicionar event listeners
        attachTreeEventListeners();
    }

    // Função: Renderizar Item da Árvore
    function renderTreeItem(item, level) {
        const indent = level * 20;
        const icon = item.type === 'folder' ? '📁' : '📄';
        const children = structureItems.filter(child => child.parent === item.id);
        
        let html = `
            <div class="tree-item" data-id="${item.id}" style="margin-left: ${indent}px">
                <div class="tree-item-header">
                    ${item.type === 'folder' && children.length > 0 ? `<span class="tree-toggle">${item.expanded ? '▼' : '▶'}</span>` : '<span class="tree-spacer"></span>'}
                    <span class="tree-icon">${icon}</span>
                    <input type="text" class="tree-name-input" value="${item.name}" placeholder="${item.type === 'folder' ? 'nome-da-pasta' : 'arquivo.txt'}" data-id="${item.id}">
                    <div class="tree-actions">
                        ${item.type === 'folder' ? `<button class="btn-icon-small btn-add-child" data-id="${item.id}" title="Adicionar item">+</button>` : ''}
                        <button class="btn-icon-small btn-remove" data-id="${item.id}" title="Remover">×</button>
                    </div>
                </div>
                ${item.type === 'file' ? `
                    <div class="tree-item-content">
                        <textarea class="file-content-input" placeholder="Conteúdo do arquivo (deixe vazio se não quiser conteúdo inicial)" data-id="${item.id}">${item.content || ''}</textarea>
                    </div>
                ` : ''}
            </div>
        `;
        
        if (item.type === 'folder' && item.expanded && children.length > 0) {
            html += children.map(child => renderTreeItem(child, level + 1)).join('');
        }
        
        return html;
    }

    // Função: Anexar Event Listeners da Árvore
    function attachTreeEventListeners() {
        // Inputs de nome
        structureTree.querySelectorAll('.tree-name-input').forEach(input => {
            input.addEventListener('input', (e) => {
                const id = parseInt(e.target.dataset.id);
                const item = structureItems.find(i => i.id === id);
                if (item) item.name = e.target.value;
            });
        });

        // Textareas de conteúdo
        structureTree.querySelectorAll('.file-content-input').forEach(textarea => {
            textarea.addEventListener('input', (e) => {
                const id = parseInt(e.target.dataset.id);
                const item = structureItems.find(i => i.id === id);
                if (item) item.content = e.target.value;
            });
        });

        // Botões de remover
        structureTree.querySelectorAll('.btn-remove').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const id = parseInt(e.target.dataset.id);
                removeItem(id);
            });
        });

        // Botões de adicionar filho
        structureTree.querySelectorAll('.btn-add-child').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const parentId = parseInt(e.target.dataset.id);
                showAddChildDialog(parentId);
            });
        });

        // Toggle de expansão
        structureTree.querySelectorAll('.tree-toggle').forEach(toggle => {
            toggle.addEventListener('click', (e) => {
                const itemDiv = e.target.closest('.tree-item');
                const id = parseInt(itemDiv.dataset.id);
                const item = structureItems.find(i => i.id === id);
                if (item) {
                    item.expanded = !item.expanded;
                    renderStructureTree();
                }
            });
        });
    }

    // Função: Mostrar Dialog de Adicionar Filho
    function showAddChildDialog(parentId) {
        const parent = structureItems.find(i => i.id === parentId);
        if (!parent || parent.type !== 'folder') return;

        // Criar um mini popup
        const popup = document.createElement('div');
        popup.className = 'add-child-popup';
        popup.innerHTML = `
            <button class="popup-btn" data-type="folder">📁 Pasta</button>
            <button class="popup-btn" data-type="file">📄 Arquivo</button>
        `;

        const parentElement = structureTree.querySelector(`[data-id="${parentId}"]`);
        parentElement.appendChild(popup);

        popup.querySelectorAll('.popup-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const type = e.target.dataset.type;
                addChildItem(parentId, type);
                popup.remove();
            });
        });

        // Remover ao clicar fora
        setTimeout(() => {
            document.addEventListener('click', function removePopup(e) {
                if (!popup.contains(e.target)) {
                    popup.remove();
                    document.removeEventListener('click', removePopup);
                }
            });
        }, 100);
    }

    // Função: Adicionar Item Filho
    function addChildItem(parentId, type) {
        const item = {
            id: itemIdCounter++,
            type: type,
            name: '',
            content: type === 'file' ? '' : null,
            parent: parentId,
            expanded: true
        };
        structureItems.push(item);
        
        // Expandir o pai
        const parent = structureItems.find(i => i.id === parentId);
        if (parent) parent.expanded = true;
        
        renderStructureTree();
    }

    // Função: Remover Item
    function removeItem(id) {
        // Remover o item e todos os seus filhos recursivamente
        function removeRecursive(itemId) {
            const children = structureItems.filter(i => i.parent === itemId);
            children.forEach(child => removeRecursive(child.id));
            structureItems = structureItems.filter(i => i.id !== itemId);
        }
        
        removeRecursive(id);
        renderStructureTree();
    }

    // Função: Converter Estrutura para JSON
    function convertStructureToJSON() {
        const result = {};
        
        function buildStructure(parentId) {
            const obj = {};
            const children = structureItems.filter(item => item.parent === parentId);
            
            children.forEach(item => {
                if (!item.name) return; // Ignorar itens sem nome
                
                if (item.type === 'folder') {
                    obj[item.name] = buildStructure(item.id);
                } else {
                    obj[item.name] = item.content || '';
                }
            });
            
            return obj;
        }
        
        return buildStructure(null);
    }

    // Função: Salvar Template
    function handleSaveTemplate() {
        const name = templateName.value.trim();
        const description = templateDescription.value.trim();

        if (!name) {
            showError('Por favor, insira um nome para o template.');
            return;
        }

        if (structureItems.length === 0) {
            showError('Por favor, adicione pelo menos uma pasta ou arquivo.');
            return;
        }

        // Validar se todos os itens têm nome
        const itemsWithoutName = structureItems.filter(item => !item.name.trim());
        if (itemsWithoutName.length > 0) {
            showError('Todos os itens devem ter um nome.');
            return;
        }

        const parsedStructure = convertStructureToJSON();

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
        vscode.postMessage({
            command: 'deleteTemplate',
            data: { name }
        });
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
                structureItems = [];
                renderStructureTree();
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