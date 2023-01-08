export class SelectionScroll
{
    #x              : number;
    #y              : number;
    #options        : any;        // TODO declare interface
    #container      : HTMLElement;

    constructor(x, y, options, callback) 
    {
        if (options.length > 1)
        {
            this.#x = x;
            this.#y = y;
            this.#options = options;

            /* Create the container of the scroll */
            this.#container = document.createElement("div");
            this.#container.id = 'selection-scroll-container';
            this.#container.style.left = this.#x + "px";
            this.#container.style.top = this.#y + "px";
            document.getElementById("map-container").appendChild(this.#container);

            for (let optionID in this.#options)
            {
                var node = document.createElement("div");
                node.classList.add("selection-scroll-element");
                node.appendChild(document.createTextNode(this.#options[optionID]));
                this.#container.appendChild(node);
                node.addEventListener('click', () => callback(this.#options[optionID]))
            }

            window.setTimeout(() => this.#show(), 100);
        }
    }

    remove()
    {
        document.getElementById("map-container").removeChild(this.#container);
    }

    #show()
    {
        this.#container.style.width = 220 + "px";
        this.#container.style.height = 220 + "px";
        this.#container.style.left = this.#x - 110 + "px";
        this.#container.style.top = this.#y - 110 + "px";
    }
}