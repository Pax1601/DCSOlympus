import { getApp } from "..";
import { Manager } from "../other/manager";

export class TemplateManager extends Manager {

    #templateEngine = require("ejs");

    constructor() {
        super();
    }

    getTemplateEngine() {
        return this.#templateEngine;
    }

    renderTemplate(name: string, data?: object) {
        const tpl = this.get(name);
        return tpl ? this.getTemplateEngine().render(tpl, data) : false;
    }

}