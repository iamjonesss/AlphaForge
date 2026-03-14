(function () {
    const root = window.AlphaForge || (window.AlphaForge = {});

    class TemplateState {
        constructor() {
            this.templates = [];
            this.selectedTemplate = null;
            this.editingTemplateName = null;
            this.targetFolderPath = '';
            this.structureItems = [];
            this.itemIdCounter = 0;
        }

        nextItemId() {
            const id = this.itemIdCounter;
            this.itemIdCounter += 1;
            return id;
        }

        resetStructure() {
            this.structureItems = [];
        }

        isEditing() {
            return Boolean(this.editingTemplateName);
        }
    }

    root.TemplateState = TemplateState;
}());