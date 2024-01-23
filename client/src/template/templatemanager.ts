import { getApp } from "..";
import { Manager } from "../other/manager";

export class TemplateManager extends Manager {

    constructor() {
        super();
    }

    renderTemplate(name:string, data?:object) {
        const tpl = this.get(name);
        return tpl ? getApp().getTemplateEngine().render(tpl, data) : false;
    }

}