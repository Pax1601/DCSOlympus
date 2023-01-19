export class Button
{
    #container: HTMLElement | null;
    constructor(ID: string, srcs: string[], callback: CallableFunction)
    {
        this.#container = document.getElementById(ID);
        if (this.#container != null)
        {
            var img = document.createElement("img");
            img.src = srcs[0]; 
            this.#container.appendChild(img);
        }
    }
}