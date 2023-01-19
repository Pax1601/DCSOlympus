export class ConnectionStatusPanel
{
    #element: HTMLElement

    constructor(ID: string)
    {
        this.#element = <HTMLElement>document.getElementById(ID);
    }

    update(connected: boolean)
    {
        if (this.#element != null)
        {
            var div = this.#element.querySelector("#status-string");
            if (div != null)
            {
                if (connected)
                {
                    div.innerHTML = "Connected";
                    div.classList.add("olympus-status-connected");
                    div.classList.remove("olympus-status-disconnected");
                }
                else
                {
                    div.innerHTML = "Disconnected";
                    div.classList.add("olympus-status-disconnected");
                    div.classList.remove("olympus-status-connected");
                }
            }
        }
    }
}