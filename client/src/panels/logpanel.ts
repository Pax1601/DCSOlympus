import { Panel } from "./panel";

export class LogPanel extends Panel
{
    #logs: String[];

    constructor(ID: string)
    {
        super(ID);
        this.#logs = [];
    }

    update(data: any)
    {
        var logs = data["logs"];
        for (let idx in logs)
        {
            if (parseInt(idx) >= this.#logs.length) {
                this.#logs.push(logs[idx]);
                var el = document.createElement("div");
                el.innerText = logs[idx];
                el.classList.add("js-log-element", "ol-log-element");
                this.getElement().appendChild(el);
                this.getElement().scrollTop = this.getElement().scrollHeight;
            }
        }
    }
}