import { ContextMenu, contextMenuConfig } from "../contextmenus/contextmenu";
import { Manager } from "../other/manager";

export type contextMenuTypes = "airbase" | "airbaseSpawn" | "map" | "unit"
export type contextMenuManagerConfig = {
    [key in contextMenuTypes]?: ContextMenu | contextMenuConfig | false
}

export class ContextMenuManager extends Manager {

    constructor(items?: contextMenuManagerConfig) {
        super();

        if (!items) return;

        for (const [name, menu] of Object.entries(items)) {
            if (typeof menu === "boolean" || menu instanceof ContextMenu) {
                this.add(name, menu);
            } else {
                this.add(name, new ContextMenu(menu));
            }
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