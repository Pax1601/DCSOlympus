import { Manager } from "../other/manager";

export class TemplateManager extends Manager {

    #templateEngine = require("ejs");

    constructor() {
        super();
    }

    getTemplateEngine() {
        return this.#templateEngine;
    }

    renderTemplateString(templateString: string, data?: object) {
        return this.getTemplateEngine().render(templateString, data);
    }

    renderTemplate(templateName: string, data?: object) {
        const tpl = this.get(templateName);
        return tpl ? this.getTemplateEngine().render(tpl, data) : false;
    }

}