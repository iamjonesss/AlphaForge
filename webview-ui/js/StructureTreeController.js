(function () {
    const root = window.AlphaForge || (window.AlphaForge = {});

    class StructureTreeController {
        constructor(treeElement, structureService) {
            this.treeElement = treeElement;
            this.structureService = structureService;
        }

        render() {
            const items = this.structureService.state.structureItems;
            if (items.length === 0) {
                this.treeElement.innerHTML = '<div class="empty-structure">Clique nos botões acima para adicionar pastas e arquivos</div>';
                return;
            }

            const rootItems = this.structureService.getChildren(null);
            this.treeElement.innerHTML = rootItems.map((item) => this.renderTreeItem(item, 0)).join('');
            this.attachEvents();
        }

        renderTreeItem(item, level) {
            const indent = level * 20;
            const children = this.structureService.getChildren(item.id);
            const icon = item.type === 'folder' ? '📁' : '📄';

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
                html += children.map((child) => this.renderTreeItem(child, level + 1)).join('');
            }

            return html;
        }

        attachEvents() {
            this.treeElement.querySelectorAll('.tree-name-input').forEach((input) => {
                input.addEventListener('input', (event) => {
                    const target = event.target;
                    const id = Number(target.dataset.id);
                    this.structureService.updateName(id, target.value);
                });
            });

            this.treeElement.querySelectorAll('.file-content-input').forEach((textarea) => {
                textarea.addEventListener('input', (event) => {
                    const target = event.target;
                    const id = Number(target.dataset.id);
                    this.structureService.updateContent(id, target.value);
                });
            });

            this.treeElement.querySelectorAll('.btn-remove').forEach((button) => {
                button.addEventListener('click', (event) => {
                    const target = event.currentTarget;
                    const id = Number(target.dataset.id);
                    this.structureService.removeItem(id);
                    this.render();
                });
            });

            this.treeElement.querySelectorAll('.btn-add-child').forEach((button) => {
                button.addEventListener('click', (event) => {
                    const target = event.currentTarget;
                    const parentId = Number(target.dataset.id);
                    this.showAddChildDialog(parentId);
                });
            });

            this.treeElement.querySelectorAll('.tree-toggle').forEach((toggle) => {
                toggle.addEventListener('click', (event) => {
                    const itemContainer = event.currentTarget.closest('.tree-item');
                    const id = Number(itemContainer.dataset.id);
                    this.structureService.toggleExpanded(id);
                    this.render();
                });
            });
        }

        showAddChildDialog(parentId) {
            const parent = this.structureService.findById(parentId);
            if (!parent || parent.type !== 'folder') {
                return;
            }

            const popup = document.createElement('div');
            popup.className = 'add-child-popup';
            popup.innerHTML = `
                <button class="popup-btn" data-type="folder">📁 Pasta</button>
                <button class="popup-btn" data-type="file">📄 Arquivo</button>
            `;

            const parentElement = this.treeElement.querySelector(`[data-id="${parentId}"]`);
            if (!parentElement) {
                return;
            }

            parentElement.appendChild(popup);

            popup.querySelectorAll('.popup-btn').forEach((button) => {
                button.addEventListener('click', (event) => {
                    const target = event.currentTarget;
                    this.structureService.addChildItem(parentId, target.dataset.type);
                    popup.remove();
                    this.render();
                });
            });

            setTimeout(() => {
                document.addEventListener('click', function removePopup(event) {
                    if (!popup.contains(event.target)) {
                        popup.remove();
                        document.removeEventListener('click', removePopup);
                    }
                });
            }, 100);
        }
    }

    root.StructureTreeController = StructureTreeController;
}());