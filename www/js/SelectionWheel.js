class SelectionWheel
{
    constructor(x, y, options) {
        if (options.length > 1)
        {
            this._x = x;
            this._y = y;
            this._options = options;
            this._angularSize = 360 / this._options.length;
            
            this._container = document.createElement("div");
            this._container.id = 'selection-wheel-container';
            this._container.style.left = this._x + "px";
            this._container.style.top = this._y + "px";
            document.getElementById("map-container").appendChild(this._container);
            
            this._wheel = document.createElement("div");
            this._wheel.id = 'selection-wheel';
            this._container.appendChild(this._wheel);
            this._wheel.addEventListener('mousemove', (e) => this._onMouseMove(e));

            this._wheel.style.setProperty('--gradient_start', this._angularSize / 2 + 'deg');
            this._wheel.style.setProperty('--gradient_stop', (360 - this._angularSize / 2) + 'deg');

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
        this._container.style.width = "200px";
        this._container.style.height = "200px";
        this._container.style.left = this._x - 100 + "px";
        this._container.style.top = this._y - 100 + "px";
    }

    _onMouseMove(e)
    {
        var angle = -rad2deg(Math.atan2(e.x - this._x, e.y - this._y)) + 180 + this._angularSize / 2;
        var index = Math.floor(angle / this._angularSize)
        this._wheel.style.transform = 'rotate('+ (index * this._angularSize) + 'deg)';
    }
}

