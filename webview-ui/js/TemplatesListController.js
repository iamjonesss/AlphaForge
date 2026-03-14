(function () {
    const root = window.AlphaForge || (window.AlphaForge = {});

    class TemplatesListController {
        constructor(listElement) {
            this.listElement = listElement;
        }

        render(templates, selectedTemplateName, handlers) {
            if (!templates.length) {
                this.listElement.innerHTML = '<p class="empty-state">Nenhum template salvo ainda. Crie seu primeiro template acima!</p>';
                return;
            }

            this.listElement.innerHTML = templates.map((template, index) => `
                <div class="template-card ${selectedTemplateName === template.name ? 'selected' : ''}" data-index="${index}">
                    <div class="template-header">
                        <h3>📦 ${template.name}</h3>
                        <div class="template-actions">
                            <button class="btn-icon btn-select" data-index="${index}" title="Selecionar">✓</button>
                            <button class="btn-icon btn-edit" data-index="${index}" title="Editar">✏️</button>
                            <button class="btn-icon btn-delete" data-index="${index}" title="Deletar">🗑️</button>
                        </div>
                    </div>
                    <p class="template-description">${template.description || 'Sem descrição'}</p>
                    <small class="template-date">Criado em: ${new Date(template.createdAt).toLocaleDateString('pt-BR')}</small>
                </div>
            `).join('');

            this.listElement.querySelectorAll('.btn-select').forEach((button) => {
                button.addEventListener('click', (event) => {
                    const index = Number(event.currentTarget.dataset.index);
                    handlers.onSelect(templates[index]);
                });
            });

            this.listElement.querySelectorAll('.btn-edit').forEach((button) => {
                button.addEventListener('click', (event) => {
                    const index = Number(event.currentTarget.dataset.index);
                    handlers.onEdit(templates[index]);
                });
            });

            this.listElement.querySelectorAll('.btn-delete').forEach((button) => {
                button.addEventListener('click', (event) => {
                    const index = Number(event.currentTarget.dataset.index);
                    handlers.onDelete(templates[index]);
                });
            });
        }
    }

    root.TemplatesListController = TemplatesListController;
}());