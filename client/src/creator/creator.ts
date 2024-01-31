import { ContextMenuManager, contextMenuTypes } from "../context/contextmenumanager";
import { ContextMenu } from "../contextmenus/contextmenu";
import { Dropdown, dropdownConfig } from "../controls/dropdown";

export class Creator {

    createDropdown(config:dropdownConfig) : Dropdown {
        return new Dropdown(config);
    }

    createContextMenu(ID:string) : ContextMenu {
        return new ContextMenu(ID);
    }

    createContextMenuManager(config?:contextMenuTypes) : ContextMenuManager {
        return new ContextMenuManager(config);
    }

}