(function () {
    function getRequiredElement(id) {
        const element = document.getElementById(id);
        if (!element) {
            throw new Error(`Elemento não encontrado: ${id}`);
        }
        return element;
    }

    const app = new window.AlphaForge.AlphaForgeApp({
        templateName: getRequiredElement('templateName'),
        templateDescription: getRequiredElement('templateDescription'),
        saveTemplateBtn: getRequiredElement('saveTemplateBtn'),
        cancelEditBtn: getRequiredElement('cancelEditBtn'),
        templatesList: getRequiredElement('templatesList'),
        selectFolderBtn: getRequiredElement('selectFolderBtn'),
        targetFolder: getRequiredElement('targetFolder'),
        applyTemplateBtn: getRequiredElement('applyTemplateBtn'),
        addFolderBtn: getRequiredElement('addFolderBtn'),
        addFileBtn: getRequiredElement('addFileBtn'),
        structureTree: getRequiredElement('structureTree')
    });

    app.init();
}());