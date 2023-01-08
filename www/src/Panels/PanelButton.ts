export class PanelButton
{
    #div            : HTMLElement;
    #enabled        : boolean;
    #callbacks      : any[];  // TODO how to set type callables?
    #baseIconHTML   : string;

    constructor(parent, icon, tooltip)
    {
        this.#div = document.createElement("div");
        this.setIcon(icon, tooltip);
        this.setSlashed(false);
        
        this.#div.classList.add("panel-button");
        parent.appendChild(this.#div);

        this.setEnabled(true);

        this.#div.onclick = () => this.#onClick();
        this.#callbacks = [];
    }
    
    setEnabled(enabled)
    {
        this.#enabled = enabled;
        if (enabled)
        {
            this.#div.classList.remove("panel-button-disabled");
        }
        else
        {
            this.#div.classList.add("panel-button-disabled");
        }
    }

    addCallback(callback)
    {
        this.#callbacks.push(callback);
    }

    clearCallbacks()
    {
        this.#callbacks = [];
    }

    setIcon(icon, tooltip)
    {
        if (icon.includes("png"))
        {
            this.#baseIconHTML = `<img src="${icon}" title="${tooltip}">`;
        }
        else
        {
            this.#baseIconHTML = `<i class="fa ${icon}" title="${tooltip}"></i>`;
        }
        this.#div.innerHTML = this.#baseIconHTML;    
    }

    setSubicon(subicon)
    {
        this.#baseIconHTML = `<div style="display: flex;">${this.#baseIconHTML}<i style="font-size: 10px;" class="fa ${subicon}"></i></div>`;
        this.#div.innerHTML = this.#baseIconHTML;
    }

    setSlashed(slashed)
    {
        if (slashed)
        {
            this.#div.innerHTML = `<div style="display: flex; justify-content: center;">${this.#baseIconHTML}<i style="position:fixed;" class="fa fa-slash"></i></div>`;
        }
        else
        {
            this.#div.innerHTML = this.#baseIconHTML;
        }
    }

    #onClick()
    {
        if (this.#enabled)
        {
            for (let callback in this.#callbacks)
            {
                this.#callbacks[callback]();
            }
        }
    }
}