import { Manager } from "../other/manager";

export class PanelsManager extends Manager {

    constructor() {
        super();
    }
    
    hideAll() {
        for (const[name, panel] of Object.entries(this.getAll())) {
            panel.hide();
        }
    }

}