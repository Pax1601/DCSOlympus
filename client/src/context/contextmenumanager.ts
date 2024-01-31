import { ContextMenu } from "../contextmenus/contextmenu";
import { Manager } from "../other/manager";

export type contextMenuTypes = {
    "map"?: ContextMenu | false,
    "unit"?: ContextMenu | false
}

export class ContextMenuManager extends Manager {

    constructor(items?:contextMenuTypes) {
        super();
        
        if (!items) return;

        for( const[ name, menu ] of Object.entries(items)) {
            if(menu instanceof ContextMenu) this.add(name, menu);
        }
    }

    add( name:string, contextMenu:ContextMenu ) {
        super.add( name, contextMenu );
        return this;
    }

    hideAll() {
        Object.values(this.getAll()).forEach(menu => (menu instanceof ContextMenu) ? menu.hide() : false);
    }

}