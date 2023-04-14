import { ContextMenu } from "./contextmenu";

export class UnitContextMenu extends ContextMenu {
    constructor(id: string) {
        super(id);
    }

    setOptions(options: {[key: string]: string}, callback: CallableFunction)
    {
        this.getContainer()?.replaceChildren(...Object.keys(options).map((option: string, idx: number) =>
        {
            var button = document.createElement("button");
            button.innerHTML = options[option];
            button.addEventListener("click", () => callback(option));
            return (button);
        }));
    }
}