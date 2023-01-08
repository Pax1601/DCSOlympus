import { deg2rad } from 'Other/Utils.js'

export class SelectionWheel
{
    #x              : number;
    #y              : number;
    #options        : any;        // TODO declare interface
    #angularSize    : number;

    #container      : HTMLElement;
    #wheel          : HTMLElement;
    #buttons        : HTMLElement[];
    #switchLabel    : HTMLLabelElement;

    constructor(x, y, options, coalition) 
    {
        if (options.length > 1)
        {
            this.#x = x;
            this.#y = y;
            this.#options = options;
            this.#angularSize = 360 / this.#options.length;
            
            /* Create the container of the wheel */
            this.#container = document.createElement("div");
            this.#container.id = 'selection-wheel-container';
            this.#container.style.left = this.#x + "px";
            this.#container.style.top = this.#y + "px";
            document.getElementById("map-container").appendChild(this.#container);
            
            /* Create the wheel itself */
            this.#wheel = document.createElement("div");
            this.#wheel.id = 'selection-wheel';
            this.#container.appendChild(this.#wheel);

            /* Create the buttons */
            this.#buttons = [];
            for (let id in this.#options)
            {
                var button = document.createElement("div");
                button.classList.add("selection-wheel-button");
                button.style.left = this.#x - 25 + "px";
                button.style.top = this.#y - 25 + "px";
                button.addEventListener('click', (e) => this.#options[id].callback(e));
                this.#container.appendChild(button);
                this.#buttons.push(button);

                var image = document.createElement("img");
                image.classList.add("selection-wheel-image");
                image.src = `img/buttons/${this.#options[id].src}`
                image.title = this.#options[id].tooltip;
                if ('tint' in this.#options[id])
                {
                    button.style.setProperty('background-color', this.#options[id].tint);
                    image.style.opacity = "0";
                }
                button.appendChild(image);
            }

            /* Show the coalition switch if requested */
            if (coalition)
            {
                this.#switchLabel = <HTMLLabelElement>document.createElement("label");
                this.#switchLabel.classList.add("switch");
                this.#switchLabel.innerHTML = `<input type="checkbox" id="coalition-switch"> <span class="slider round"></span>`
                this.#container.appendChild(this.#switchLabel);
                document.getElementById("coalition-switch").addEventListener('change', (e) => this.#onSwitch(e))

                if (map.getActiveCoalition() == "red")
                {
                    document.documentElement.style.setProperty('--normal', getComputedStyle(this.#container).getPropertyValue("--red"));
                    (<HTMLInputElement>document.getElementById("coalition-switch")).checked = true;
                }
                else
                {
                    document.documentElement.style.setProperty('--normal', getComputedStyle(this.#container).getPropertyValue("--blue"));
                }
            }
            else
            {
                document.documentElement.style.setProperty('--normal', getComputedStyle(this.#container).getPropertyValue("--dark"));
            }
            
            window.setTimeout(() => this.#show(), 100);
        }
    }

    remove()
    {
        if (this.#container != undefined)
        {
            this.#container.removeChild(this.#wheel);
            document.getElementById("map-container").removeChild(this.#container);
        }
    }

    #show()
    {
        this.#container.style.width = 220 + "px";
        this.#container.style.height = 220 + "px";
        this.#container.style.left = this.#x - 110 + "px";
        this.#container.style.top = this.#y - 110 + "px";

        var r = 80;
        for (let id in this.#buttons)
        {
            var angle = parseInt(id) * this.#angularSize;
            this.#buttons[id].style.opacity = "1";
            this.#buttons[id].style.left = this.#x + r * Math.sin(deg2rad(angle)) - 25 + "px";
            this.#buttons[id].style.top = this.#y - r * Math.cos(deg2rad(angle)) - 25 + "px";
        }

        if (this.#switchLabel != undefined)
        {
            this.#switchLabel.style.opacity = "1";   
        } 
    }

    #onSwitch(e)
    {
        if (e.currentTarget.checked) {
            document.documentElement.style.setProperty('--normal', getComputedStyle(this.#container).getPropertyValue("--red"));
            map.setActiveCoalition("red");
        } else {
            document.documentElement.style.setProperty('--normal', getComputedStyle(this.#container).getPropertyValue("--blue"));
            map.setActiveCoalition("blue");
        }
    }
}

