import { AirbaseContextMenu } from "../contextmenus/airbasecontextmenu";
import { AirbaseSpawnContextMenu } from "../contextmenus/airbasespawnmenu";
import { CoalitionAreaContextMenu } from "../contextmenus/coalitionareacontextmenu";
import { ContextMenu, contextMenuConfig } from "../contextmenus/contextmenu";
import { MapContextMenu } from "../contextmenus/mapcontextmenu";
import { UnitContextMenu } from "../contextmenus/unitcontextmenu";
import { Manager } from "../other/manager";

export type contextMenuManagerConfig = {
    [key: string]: contextMenuConfig | false
};

export class ContextMenuManager extends Manager {

    constructor(items?: contextMenuManagerConfig) {
        super();

        if (!items) return;

        for (const [name, menu] of Object.entries(items)) {
            if (typeof menu === "boolean") {
                this.add(name, menu);
            } else {
                let menuInstance: any = false;
                switch (name) {
                    case "airbase":
                        menuInstance = new AirbaseContextMenu(menu);
                        break;
                    case "airbaseSpawn":
                        menuInstance = new AirbaseSpawnContextMenu(menu);
                        break;
                    case "coalitionArea":
                        menuInstance = new CoalitionAreaContextMenu(menu);
                        break;
                    case "map":
                        menuInstance = new MapContextMenu(menu);
                        break;
                    case "unit":
                        menuInstance = new UnitContextMenu(menu);
                        break;
                    default:
                        menuInstance = new ContextMenu(menu);
                }

                if (menuInstance instanceof ContextMenu) {
                    this.add(name, menuInstance);
                }
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