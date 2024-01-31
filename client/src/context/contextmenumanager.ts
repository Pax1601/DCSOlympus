import { ContextMenu, contextMenuConfig } from "../contextmenus/contextmenu";
import { Manager } from "../other/manager";

export type contextMenuTypes = "map" | "unit"
export type contextMenuManagerConfig = {
    [key in contextMenuTypes]?: contextMenuConfig | false
}

export class ContextMenuManager extends Manager {

    constructor(items?: contextMenuManagerConfig) {
        super();

        if (!items) return;

        for (const [name, menu] of Object.entries(items)) {
            this.add(name, (menu) ? new ContextMenu(menu.id) : false);   //  TODO: make this pass the whole config
        }
    }

    add(name: string, contextMenu: ContextMenu | false) {
        super.add(name, contextMenu);
        return this;
    }

    hideAll() {
        Object.values(this.getAll()).forEach(menu => (menu instanceof ContextMenu) ? menu.hide() : false);
    }

}