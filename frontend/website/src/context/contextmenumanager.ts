import { ContextMenu } from "../contextmenus/contextmenu";
import { Manager } from "../other/manager";

export class ContextMenuManager extends Manager {

    constructor() {
        super();
    }

    add( name:string, contextMenu:ContextMenu ) {
        super.add( name, contextMenu );
        return this;
    }

}