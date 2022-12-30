class PanelButton
{
    constructor(parent, icon)
    {
        this._div = document.createElement("div");
        this.setIcon(icon);
        this.setSlashed(false);
        
        this._div.classList.add("panel-button");
        parent.appendChild(this._div);

        this.setEnabled(true);

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

    setIcon(icon)
    {
        this._baseIcon = `<i class="fa ${icon}"></i>`;
        this._div.innerHTML = this._baseIcon;    
    }

    setSubicon(subicon)
    {
        this._baseIcon = `<div style="display: flex;">${this._baseIcon}<i style="font-size: 10px;" class="fa ${subicon}"></i></div>`;
        this._div.innerHTML = this._baseIcon;
    }

    setSlashed(slashed)
    {
        if (slashed)
        {
            this._div.innerHTML = `<div style="display: flex; justify-content: center;">${this._baseIcon}<i style="position:fixed;" class="fa fa-slash"></i></div>`;
        }
        else
        {
            this._div.innerHTML = this._baseIcon;
        }
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