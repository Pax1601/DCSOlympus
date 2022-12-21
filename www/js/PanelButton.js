class PanelButton
{
    constructor(parent, type)
    {
        this._div= document.createElement("div");
        this._div.innerHTML = `<i class="fa ${type}"></i>`
        this._div.classList.add("panel-button");
        parent.appendChild(this._div);

        this.setEnabled(false);

        this._div.onclick = () => this._onClick();
        this._callbacks = [];
    }
    
    setEnabled(enabled)
    {
        this._enabled = enabled;
        if (enabled)
        {
            this._div.classList.remove("panel-button-disabled");
        }
        else
        {
            this._div.classList.add("panel-button-disabled");
        }
        
    }

    addCallback(callback)
    {
        this._callbacks.push(callback);
    }

    clearCallbacks()
    {
        this._callbacks = [];
    }

    _onClick()
    {
        if (this._enabled)
        {
            for (let callback in this._callbacks)
            {
                this._callbacks[callback]();
            }
        }
    }

}