class SelectionScroll
{
    constructor(x, y, options, callback) 
    {
        if (options.length > 1)
        {
            this._x = x;
            this._y = y;
            this._options = options;

            /* Create the container of the scroll */
            this._container = document.createElement("div");
            this._container.id = 'selection-scroll-container';
            this._container.style.left = this._x + "px";
            this._container.style.top = this._y + "px";
            document.getElementById("map-container").appendChild(this._container);

            for (let optionID in this._options)
            {
                var node = document.createElement("div");
                node.classList.add("selection-scroll-element");
                node.appendChild(document.createTextNode(this._options[optionID]));
                this._container.appendChild(node);
                node.addEventListener('click', () => callback(this._options[optionID]))
            }

            window.setTimeout(() => this._show(), 100);
        }
    }

    remove()
    {
        document.getElementById("map-container").removeChild(this._container);
    }

    _show()
    {
        this._container.style.width = 220 + "px";
        this._container.style.height = 220 + "px";
        this._container.style.left = this._x - 110 + "px";
        this._container.style.top = this._y - 110 + "px";
    }
}