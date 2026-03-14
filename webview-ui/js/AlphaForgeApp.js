(function () {
    const root = window.AlphaForge || (window.AlphaForge = {});

    class AlphaForgeApp {
        constructor(elements) {
            this.elements = elements;
            this.messenger = new root.VSCodeMessenger();
            this.state = new root.TemplateState();
            this.structureService = new root.TemplateStructureService(this.state);
            this.structureTreeController = new root.StructureTreeController(elements.structureTree, this.structureService);
            this.templatesListController = new root.TemplatesListController(elements.templatesList);
        }

        init() {
            this.bindStaticEvents();
            this.bindBackendEvents();
            this.structureTreeController.render();
            this.loadTemplates();
        }

        bindStaticEvents() {
            this.elements.saveTemplateBtn.addEventListener('click', () => this.handleSaveTemplate());
            this.elements.cancelEditBtn.addEventListener('click', () => this.exitEditMode());
            this.elements.importTemplateBtn.addEventListener('click', () => this.handleImportTemplate());
            this.elements.exportTemplateBtn.addEventListener('click', () => this.handleExportTemplate());
            this.elements.selectFolderBtn.addEventListener('click', () => this.handleSelectFolder());
            this.elements.applyTemplateBtn.addEventListener('click', () => this.handleApplyTemplate());
            this.elements.addFolderBtn.addEventListener('click', () => {
                this.structureService.addRootItem('folder');
                this.structureTreeController.render();
            });
            this.elements.addFileBtn.addEventListener('click', () => {
                this.structureService.addRootItem('file');
                this.structureTreeController.render();
            });
        }

        bindBackendEvents() {
            this.messenger.onMessage((message) => {
                switch (message.command) {
                    case 'templatesList':
                        this.state.templates = message.data || [];
                        this.renderTemplates();
                        break;
                    case 'templateSaved':
                        this.messenger.showInfo('Template salvo com sucesso!');
                        this.exitEditMode();
                        this.loadTemplates();
                        break;
                    case 'templateUpdated':
                        this.messenger.showInfo(`Template "${message.data.newName}" atualizado com sucesso!`);
                        if (this.state.selectedTemplate && this.state.selectedTemplate.name === message.data.oldName) {
                            this.state.selectedTemplate.name = message.data.newName;
                        }
                        this.exitEditMode();
                        this.loadTemplates();
                        break;
                    case 'templateDeleted':
                        this.messenger.showInfo('Template deletado com sucesso!');
                        this.handleTemplateDeleted(message.data.name);
                        this.loadTemplates();
                        break;
                    case 'templateImported':
                        this.messenger.showInfo(`Template "${message.data.name}" importado com sucesso!`);
                        this.loadTemplates();
                        break;
                    case 'templateExported':
                        this.messenger.showInfo(`Template "${message.data.name}" exportado para: ${message.data.path}`);
                        break;
                    case 'folderSelected':
                        this.state.targetFolderPath = message.data.path;
                        this.elements.targetFolder.value = message.data.path;
                        break;
                    case 'templateApplied':
                        this.messenger.showInfo(`Template aplicado com sucesso em: ${message.data.path}`);
                        break;
                    default:
                        break;
                }
            });
        }

        renderTemplates() {
            const selectedName = this.state.selectedTemplate ? this.state.selectedTemplate.name : null;
            this.templatesListController.render(this.state.templates, selectedName, {
                onSelect: (template) => this.selectTemplate(template),
                onEdit: (template) => this.startEditTemplate(template),
                onDelete: (template) => this.deleteTemplate(template.name)
            });
        }

        handleSaveTemplate() {
            const name = this.elements.templateName.value.trim();
            const description = this.elements.templateDescription.value.trim();

            if (!name) {
                this.messenger.showError('Por favor, insira um nome para o template.');
                return;
            }

            if (!this.structureService.hasItems()) {
                this.messenger.showError('Por favor, adicione pelo menos uma pasta ou arquivo.');
                return;
            }

            if (this.structureService.hasItemsWithoutName()) {
                this.messenger.showError('Todos os itens devem ter um nome.');
                return;
            }

            const structure = this.structureService.toTemplateJSON();

            if (this.state.isEditing()) {
                this.messenger.post('updateTemplate', {
                    originalName: this.state.editingTemplateName,
                    name,
                    description,
                    structure
                });
                return;
            }

            this.messenger.post('saveTemplate', {
                name,
                description,
                structure
            });
        }

        handleSelectFolder() {
            this.messenger.post('selectFolder');
        }

        handleImportTemplate() {
            this.messenger.post('importTemplate');
        }

        handleExportTemplate() {
            if (!this.state.selectedTemplate) {
                this.messenger.showError('Selecione um template para exportar.');
                return;
            }

            this.messenger.post('exportTemplate', {
                name: this.state.selectedTemplate.name
            });
        }

        handleApplyTemplate() {
            if (!this.state.selectedTemplate) {
                this.messenger.showError('Por favor, selecione um template primeiro.');
                return;
            }

            this.messenger.post('applyTemplate', {
                templateName: this.state.selectedTemplate.name,
                targetPath: this.state.targetFolderPath
            });
        }

        loadTemplates() {
            this.messenger.post('getTemplates');
        }

        selectTemplate(template) {
            this.state.selectedTemplate = template;
            this.elements.applyTemplateBtn.disabled = false;
            this.renderTemplates();
            this.messenger.showInfo(`Template "${template.name}" selecionado!`);
        }

        startEditTemplate(template) {
            if (!template) {
                return;
            }

            this.elements.templateName.value = template.name || '';
            this.elements.templateDescription.value = template.description || '';
            this.structureService.loadFromTemplateJSON(template.structure || {});
            this.structureTreeController.render();

            this.state.editingTemplateName = template.name;
            this.elements.saveTemplateBtn.textContent = '💾 Atualizar Template';
            this.elements.cancelEditBtn.style.display = 'inline-flex';

            this.messenger.showInfo(`Editando template "${template.name}".`);
        }

        exitEditMode() {
            this.state.editingTemplateName = null;
            this.elements.saveTemplateBtn.textContent = '💾 Salvar Template';
            this.elements.cancelEditBtn.style.display = 'none';
            this.elements.templateName.value = '';
            this.elements.templateDescription.value = '';
            this.state.resetStructure();
            this.structureTreeController.render();
        }

        deleteTemplate(name) {
            this.messenger.post('deleteTemplate', { name });
        }

        handleTemplateDeleted(name) {
            if (this.state.selectedTemplate && this.state.selectedTemplate.name === name) {
                this.state.selectedTemplate = null;
                this.elements.applyTemplateBtn.disabled = true;
            }

            if (this.state.editingTemplateName === name) {
                this.exitEditMode();
            }
        }
    }

    root.AlphaForgeApp = AlphaForgeApp;
}());