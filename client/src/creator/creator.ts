import { ContextMenuManager, TContextMenuTypes } from "../context/contextmenumanager";
import { ContextMenu } from "../contextmenus/contextmenu";
import { Dropdown, TDropdownConfig } from "../controls/dropdown";

export class Creator {

    createDropdown(config:TDropdownConfig) : Dropdown {
        return new Dropdown(config);
    }

    createContextMenu(ID:string) : ContextMenu {
        return new ContextMenu(ID);
    }

    createContextMenuManager(config?:TContextMenuTypes) : ContextMenuManager {
        return new ContextMenuManager(config);
    }

}