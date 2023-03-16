import { ContextMenu } from "./contextmenu";

export class UnitContextMenu extends ContextMenu {
    constructor(id: string) {
        super(id);
    }

    setOptions(options: string[], callback: CallableFunction)
    {
        this.getContainer()?.replaceChildren(...options.map((option: string) =>
        {
            var button = document.createElement("button");
            button.innerText = option;
            button.addEventListener("click", () => callback(option));
            return (button);
        }));
    }
}