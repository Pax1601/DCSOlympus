import { getActiveCoalition, setActiveCoalition } from "..";
import { ContextMenuOption } from "../@types/dom";

export class ContextMenu {
    #container: HTMLElement | null;

    constructor(id: string,) {
        this.#container = document.getElementById(id);
        this.#container?.querySelector("#switch")?.addEventListener('change', (e) => this.#onSwitch(e))
        this.hide();
    }

    show(x: number, y: number, title: string, options: ContextMenuOption[], showCoalition: boolean) {
        this.#container?.classList.toggle("hide", false);

        this.#container?.querySelector("#list")?.replaceChildren(...options.map((option: ContextMenuOption) => {
            var li = document.createElement("li");
            var button = document.createElement("button");
            button.textContent = option.tooltip;
            li.appendChild(button);
            button.addEventListener("click", (e: MouseEvent) => option.callback((e.target as HTMLButtonElement).innerText));
            return button;
        }));

        this.#container?.querySelector("#switch")?.classList.toggle("hide", !showCoalition);
        
        if (this.#container != null && options.length >= 1) {
            var titleDiv = this.#container.querySelector("#title");
            if (titleDiv)
                titleDiv.textContent = title;

            if (x - this.#container.offsetWidth / 2 + this.#container.offsetWidth < window.innerWidth)
                this.#container.style.left = x - this.#container.offsetWidth / 2 + "px";
            else
                this.#container.style.left = window.innerWidth - this.#container.offsetWidth + "px";

            if (y - 20 + this.#container.offsetHeight < window.innerHeight)
                this.#container.style.top = y - 20 + "px";
            else
                this.#container.style.top = window.innerHeight - this.#container.offsetHeight + "px";
        }
    }

    hide() {
        this.#container?.classList.toggle("hide", true);
    }

    #onSwitch(e: any) {
        if (this.#container != null) {
            if (e.currentTarget.checked) 
                setActiveCoalition("red");
            else 
                setActiveCoalition("blue");
        }
    }
}