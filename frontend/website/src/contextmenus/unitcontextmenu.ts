import { ContextActionSet } from "../unit/contextactionset";
import { ContextMenu } from "./contextmenu";

/** The UnitContextMenu is shown when the user rightclicks on a unit. It dynamically presents the user with possible actions to perform on the unit. */
export class UnitContextMenu extends ContextMenu {
    /**
     * 
     * @param ID - the ID of the HTML element which will contain the context menu
     */
    constructor(ID: string){
        super(ID);
    }

    /** Set the options that will be presented to the user in the contextmenu
     * 
     * @param options Dictionary element containing the text and tooltip of the options shown in the menu
     * @param callback Callback that will be called when the user clicks on one of the options
     */
    setContextActions(contextActionSet: ContextActionSet) {
        this.getContainer()?.replaceChildren(...Object.keys(contextActionSet.getContextActions()).map((key: string, idx: number) => {
            const contextAction = contextActionSet.getContextActions()[key];
            var button = document.createElement("button");
            var el = document.createElement("div");
            el.title = contextAction.getDescription();
            el.innerText = contextAction.getLabel();
            el.id = key;
            button.addEventListener("click", () => {
                contextAction.executeCallback();
                if (contextAction.getHideContextAfterExecution())
                    this.hide();
            });
            button.appendChild(el);
            return (button);
        }));
    }
}