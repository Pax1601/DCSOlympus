class SelectionWheel
{
    constructor(x, y, options) 
    {
        if (options.length > 1)
        {
            this._x = x;
            this._y = y;
            this._options = options;
            this._angularSize = 360 / this._options.length;
            
            /* Create the container of the wheel */
            this._container = document.createElement("div");
            this._container.id = 'selection-wheel-container';
            this._container.style.left = this._x + "px";
            this._container.style.top = this._y + "px";
            document.getElementById("map-container").appendChild(this._container);
            
            /* Create the wheel itself */
            this._wheel = document.createElement("div");
            this._wheel.id = 'selection-wheel';
            this._container.appendChild(this._wheel);

            /* Create the buttons */
            this._buttons = [];
            for (let id in this._options)
            {
                var button = document.createElement("div");
                button.classList.add("selection-wheel-button");
                button.style.left = this._x - 25 + "px";
                button.style.top = this._y - 25 + "px";
                button.addEventListener('click', (e) => this._options[id].callback(e));
                this._container.appendChild(button);
                this._buttons.push(button);

                var image = document.createElement("img");
                image.classList.add("selection-wheel-image");
                image.src = `img/buttons/${this._options[id].src}`
                if ('tint' in this._options[id])
                {
                    button.style.setProperty('background-color', this._options[id].tint);
                    image.style.opacity = 0;
                }
                button.appendChild(image);
            }

            /* Show the coalition switch if requested */
            this._switchLabel = document.createElement("label");
            this._switchLabel.classList.add("switch");
            this._switchLabel.innerHTML = `<input type="checkbox" id="coalition-switch"> <span class="slider round"></span>`
            this._container.appendChild(this._switchLabel);
            document.getElementById("coalition-switch").addEventListener('change', (e) => this._onSwitch(e))

            if (map.getActiveCoalition() == "red")
            {
                document.getElementById("coalition-switch").checked = true;
            }
            
            window.setTimeout(() => this._show(), 100);
        }
    }

    remove()
    {
        this._container.removeChild(this._wheel);
        document.getElementById("map-container").removeChild(this._container);
    }

    _show()
    {
        this._container.style.width = 220 + "px";
        this._container.style.height = 220 + "px";
        this._container.style.left = this._x - 110 + "px";
        this._container.style.top = this._y - 110 + "px";

        var r = 80;
        for (let id in this._buttons)
        {
            var angle = parseInt(id) * this._angularSize;
            this._buttons[id].style.opacity = 1;
            this._buttons[id].style.left = this._x + r * Math.sin(deg2rad(angle)) - 25 + "px";
            this._buttons[id].style.top = this._y - r * Math.cos(deg2rad(angle)) - 25 + "px";
        }

        this._switchLabel.style.opacity = 1;        
    }

    _onSwitch(e)
    {
        if (e.currentTarget.checked) {
            document.documentElement.style.setProperty('--normal', getComputedStyle(this._container).getPropertyValue("--red"));
            map.setActiveCoalition("red");
        } else {
            document.documentElement.style.setProperty('--normal', getComputedStyle(this._container).getPropertyValue("--blue"));
            map.setActiveCoalition("blue");
        }
    }
}

