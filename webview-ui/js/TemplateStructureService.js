(function () {
    const root = window.AlphaForge || (window.AlphaForge = {});

    class TemplateStructureService {
        constructor(state) {
            this.state = state;
        }

        createItem(type, parent = null) {
            return {
                id: this.state.nextItemId(),
                type,
                name: '',
                content: type === 'file' ? '' : null,
                parent,
                expanded: true
            };
        }

        addRootItem(type) {
            this.state.structureItems.push(this.createItem(type, null));
        }

        addChildItem(parentId, type) {
            this.state.structureItems.push(this.createItem(type, parentId));
            const parent = this.findById(parentId);
            if (parent) {
                parent.expanded = true;
            }
        }

        findById(id) {
            return this.state.structureItems.find((item) => item.id === id);
        }

        getChildren(parentId) {
            return this.state.structureItems.filter((item) => item.parent === parentId);
        }

        updateName(id, name) {
            const item = this.findById(id);
            if (item) {
                item.name = name;
            }
        }

        updateContent(id, content) {
            const item = this.findById(id);
            if (item && item.type === 'file') {
                item.content = content;
            }
        }

        toggleExpanded(id) {
            const item = this.findById(id);
            if (item && item.type === 'folder') {
                item.expanded = !item.expanded;
            }
        }

        removeItem(id) {
            const idsToRemove = new Set();

            const collectChildren = (itemId) => {
                idsToRemove.add(itemId);
                this.getChildren(itemId).forEach((child) => collectChildren(child.id));
            };

            collectChildren(id);
            this.state.structureItems = this.state.structureItems.filter((item) => !idsToRemove.has(item.id));
        }

        hasItems() {
            return this.state.structureItems.length > 0;
        }

        hasItemsWithoutName() {
            return this.state.structureItems.some((item) => !item.name.trim());
        }

        toTemplateJSON() {
            const build = (parentId) => {
                const obj = {};
                this.getChildren(parentId).forEach((item) => {
                    if (!item.name) {
                        return;
                    }

                    if (item.type === 'folder') {
                        obj[item.name] = build(item.id);
                    } else {
                        obj[item.name] = item.content || '';
                    }
                });
                return obj;
            };

            return build(null);
        }

        loadFromTemplateJSON(structure) {
            this.state.resetStructure();

            const walk = (node, parentId) => {
                Object.keys(node).forEach((key) => {
                    const value = node[key];
                    const isFolder = typeof value === 'object' && value !== null;
                    const item = {
                        id: this.state.nextItemId(),
                        type: isFolder ? 'folder' : 'file',
                        name: key,
                        content: isFolder ? null : String(value ?? ''),
                        parent: parentId,
                        expanded: true
                    };

                    this.state.structureItems.push(item);

                    if (isFolder) {
                        walk(value, item.id);
                    }
                });
            };

            walk(structure || {}, null);
        }
    }

    root.TemplateStructureService = TemplateStructureService;
}());