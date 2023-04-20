import { getUnitsManager } from "..";
import { deg2rad } from "../other/utils";
import { ContextMenu } from "./contextmenu";

export class UnitContextMenu extends ContextMenu {
    #customFormationCallback: CallableFunction | null = null;

    constructor(id: string) {
        super(id);

        document.addEventListener("applyCustomFormation", () => {
            var dialog = document.getElementById("custom-formation-dialog");
            if (dialog)
            {
                dialog.classList.add("hide");
                var clock = 1;
                while (clock < 8)
                {
                    if ((<HTMLInputElement> dialog.querySelector(`#formation-${clock}`)).checked) 
                        break
                    clock++;
                }
                var angleDeg = 360 - (clock - 1) * 45;
                var angleRad = deg2rad(angleDeg);
                var distance = parseInt((<HTMLInputElement> dialog.querySelector(`#distance`)?.querySelector("input")).value) * 0.3048;
                var upDown = parseInt((<HTMLInputElement> dialog.querySelector(`#up-down`)?.querySelector("input")).value) * 0.3048;
                
                // X: front-rear, positive front
                // Y: top-bottom, positive top
                // Z: left-right, positive right

                var x = distance * Math.cos(angleRad);
                var y = upDown;
                var z = distance * Math.sin(angleRad);

                if (this.#customFormationCallback)
                    this.#customFormationCallback({"x": x, "y": y, "z": z})
            }
        })
    }

    setCustomFormationCallback(callback: CallableFunction) {
        this.#customFormationCallback = callback;
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