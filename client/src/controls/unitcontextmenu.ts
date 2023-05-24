import { deg2rad } from "../other/utils";
import { ContextMenu } from "./contextmenu";

export class UnitContextMenu extends ContextMenu {
    #customFormationCallback: CallableFunction | null = null;

    constructor(id: string) {
        super(id);

        document.addEventListener("applyCustomFormation", () => {
            var dialog = document.getElementById("custom-formation-dialog");
            if (dialog) {
                dialog.classList.add("hide");
                var clock = 1;
                while (clock < 8) {
                    if ((<HTMLInputElement>dialog.querySelector(`#formation-${clock}`)).checked)
                        break
                    clock++;
                }
                var angleDeg = 360 - (clock - 1) * 45;
                var angleRad = deg2rad(angleDeg);
                var distance = parseInt((<HTMLInputElement>dialog.querySelector(`#distance`)?.querySelector("input")).value) * 0.3048;
                var upDown = parseInt((<HTMLInputElement>dialog.querySelector(`#up-down`)?.querySelector("input")).value) * 0.3048;

                // X: front-rear, positive front
                // Y: top-bottom, positive top
                // Z: left-right, positive right

                var x = distance * Math.cos(angleRad);
                var y = upDown;
                var z = distance * Math.sin(angleRad);

                if (this.#customFormationCallback)
                    this.#customFormationCallback({ "x": x, "y": y, "z": z })
            }
        })
    }

    setCustomFormationCallback(callback: CallableFunction) {
        this.#customFormationCallback = callback;
    }

    setOptions(options: { [key: string]: {text: string, tooltip: string }}, callback: CallableFunction) {
        this.getContainer()?.replaceChildren(...Object.keys(options).map((key: string, idx: number) => {
            const option = options[key];
            var button = document.createElement("button");
            var el = document.createElement("div");
            el.title = option.tooltip;
            el.innerText = option.text;
            el.id = key;
            button.addEventListener("click", () => callback(key));
            button.appendChild(el);
            return (button);
        }));
    }
}