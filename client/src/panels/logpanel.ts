import { Panel } from "./panel";

export class LogPanel extends Panel {
    #open: boolean = false;
    #queuedMessages: number = 0;
    #scrolledDown: boolean = true;
    #logs: {[key: string]: string} = {};

    constructor(ID: string) {
        super(ID);

        document.addEventListener("toggleLogPanel", () => {
            this.getElement().classList.toggle("open");
            this.#open = !this.#open;
            this.#queuedMessages = 0;
            this.#updateHeader();

            if (this.#scrolledDown) 
                this.#scrollDown();
        });

        const scrollEl = this.getElement().querySelector(".ol-scrollable");
        if (scrollEl) {
            scrollEl.addEventListener("scroll", () => {
                this.#scrolledDown = Math.abs(scrollEl.scrollHeight - scrollEl.scrollTop - scrollEl.clientHeight) < 1
            })
        }
    }

    appendLogs(logs: {[key: string]: string}) {
        Object.keys(logs).forEach((key: string) => {
            if (!(key in this.#logs)) {
                this.#logs[key] = logs[key];
                this.appendLog(logs[key]);
            }
        });
    }

    appendLog(log: string) {
        var el = document.createElement("div");
        el.classList.add("ol-log-entry");
        el.textContent = log;
        this.getElement().querySelector(".ol-scrollable")?.appendChild(el);
        console.log(log);

        if (!this.#open)
            this.#queuedMessages++;

        this.#updateHeader();

        if (this.#scrolledDown) 
            this.#scrollDown();
    }

    #updateHeader() {
        const headerEl = this.getElement().querySelector("#log-panel-header") as HTMLElement;
        if (headerEl) {
            if (this.#queuedMessages)
                headerEl.innerText = `Server log (${this.#queuedMessages})`;
            else
                headerEl.innerText = `Server log`;
        }
    }

    #scrollDown() {
        const scrollEl = this.getElement().querySelector(".ol-scrollable");
        if (scrollEl) {
            scrollEl.scrollTop = scrollEl.scrollHeight - scrollEl.clientHeight;
        }
    }
}