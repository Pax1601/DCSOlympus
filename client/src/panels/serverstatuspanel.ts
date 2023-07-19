import { Panel } from "./panel";

export class ServerStatusPanel extends Panel {
    constructor(ID: string) {
        super(ID);
    }

    update(frameRate: number, load: number) {
        const frameRateEl = this.getElement().querySelector("#server-frame-rate");
        if (frameRateEl) {
            frameRateEl.textContent = `${frameRate}`;
            frameRateEl.classList.toggle("fps-high", frameRate >= 60)
            frameRateEl.classList.toggle("fps-medium", frameRate >= 30 && frameRate < 60)
            frameRateEl.classList.toggle("fps-low", frameRate <= 30)
        }

        const loadEl = this.getElement().querySelector("#server-load");
        if (loadEl) {
            loadEl.textContent = `${load}`;
            loadEl.classList.toggle("load-high", load >= 1000)
            loadEl.classList.toggle("load-medium", load >= 100 && load < 1000)
            loadEl.classList.toggle("load-low", load <= 100)
        }
        
    }
}