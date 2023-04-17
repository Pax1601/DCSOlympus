import { ContextMenu } from "./contextmenu";

export class UnitContextMenu extends ContextMenu {
    #callback: CallableFunction | null = null;

    constructor(id: string) {
        super(id);

        document.addEventListener("applyCustomFormation", () => {
            var dialog = document.getElementById("custom-formation-dialog");
            if (dialog)
            {
                dialog.classList.add("hide");
            }

            if (this.#callback)
                this.#callback()
        })
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