import { getApp } from "..";
import { MouseInfoPanel } from "./mouseinfopanel";
import { Panel } from "./panel";

export class LogPanel extends Panel {
    #open: boolean = false;
    #queuedMessages: number = 0;
    #scrolledDown: boolean = true;
    #logs: {[key: string]: string} = {};

    /**
     * 
     * @param ID - the ID of the HTML element which will contain the context menu
     */
    constructor(ID: string){
        super(ID);

        document.addEventListener("toggleLogPanel", () => {
            this.getElement().classList.toggle("open");
            this.#open = !this.#open;
            this.#queuedMessages = 0;
            this.#updateHeader();
            this.#calculateHeight();

            if (this.#scrolledDown) 
                this.#scrollDown();
        });

        const scrollEl = this.getElement().querySelector(".ol-scrollable");
        if (scrollEl) {
            scrollEl.addEventListener("scroll", () => {
                this.#scrolledDown = Math.abs(scrollEl.scrollHeight - scrollEl.scrollTop - scrollEl.clientHeight) < 1
            });
        }

        window.addEventListener("resize", () => {
            this.#calculateHeight();
        });

        
        const mouseInfoPanel = getApp().getPanelsManager().get("mouseInfo") as MouseInfoPanel;
        new ResizeObserver(() => this.#calculateHeight()).observe(mouseInfoPanel.getElement())
    }

    show() {
        super.show();
        this.#calculateHeight();
    }

    appendLogs(logs: {[key: string]: any}) {
        Object.keys(logs).forEach((key: string) => {
            if (!(key in this.#logs)) {
                this.#logs[key] = logs[key];
                this.appendLog(logs[key].commander, logs[key].message);
            }
        });
    }

    appendLog(commander: string, log: string) {
        var el = document.createElement("div");
        el.classList.add("ol-log-entry");
        el.textContent = commander + " - " + log;
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

    #calculateHeight() {
        const mouseInfoPanel = getApp().getPanelsManager().get("mouseInfo");
        if (this.#open)
            this.getElement().style.height = `${mouseInfoPanel.getElement().offsetTop - this.getElement().offsetTop - 10}px`;
        else 
            this.getElement().style.height = "fit-content";
    }
}