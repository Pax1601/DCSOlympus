import { setActiveCoalition } from "..";
import { deg2rad } from "../other/utils";

export class SelectionWheel
{
    #container: HTMLElement | null;
    #display: string;

    constructor(id: string)
    {
        this.#container = document.getElementById(id);
        this.#display = '';
        if (this.#container != null)
        {
            this.#container.querySelector("#coalition-switch")?.addEventListener('change', (e) => this.#onSwitch(e))
            this.#display = this.#container.style.display;
            this.hide();
        }
    }
    
    show(x: number, y: number, options: any, showCoalition: boolean)
    {
        /* Hide to remove buttons, if present */
        this.hide();

        if (this.#container != null)
        {
            this.#container.style.display = this.#display;
            this.#container.style.left = x - 110 + "px";
            this.#container.style.top = y - 110 + "px"; 

            var angularSize = 360 / options.length;
            var r = 80;

            /* Create the buttons */
            for (let id in options)
            {
                var button = document.createElement("div");
                button.classList.add("selection-wheel-button");
                button.style.left = x - 25 + "px";
                button.style.top = y - 25 + "px";
                button.addEventListener('click', (e) => options[id].callback(e));
                this.#container.appendChild(button);
                var angle = parseInt(id) * angularSize;
                button.style.opacity = "1";
                button.style.left = x + r * Math.sin(deg2rad(angle)) - 25 + "px";
                button.style.top = y - r * Math.cos(deg2rad(angle)) - 25 + "px";

                var image = document.createElement("img");
                image.classList.add("selection-wheel-image");
                image.src = `images/buttons/${options[id].src}`
                image.title = options[id].tooltip;
                if ('tint' in options[id])
                {
                    button.style.setProperty('background-color', options[id].tint);
                    image.style.opacity = "0";
                }
                button.appendChild(image);
            }
        }
    }

    hide()
    {
        if (this.#container != null)
        {
            this.#container.style.display = "none";
            var buttons = this.#container.querySelectorAll(".selection-wheel-button");
            for (let child of buttons)
            {
                this.#container.removeChild(child);
            }
        }
    }

    #onSwitch(e: any)
    {
        if (this.#container != null)
        {
            if (e.currentTarget.checked)
            {
                document.documentElement.style.setProperty('--active-coalition-color', getComputedStyle(this.#container).getPropertyValue("--red-coalition-color"));
                setActiveCoalition("red");
            }
            else
            {
                document.documentElement.style.setProperty('--active-coalition-color', getComputedStyle(this.#container).getPropertyValue("--blue-coalition-color"));
                setActiveCoalition("blue");
            }
        }        
    }
}