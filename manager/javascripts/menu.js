const ManagerPage = require("./managerpage");
const ejs = require('ejs')
const { logger } = require("./filesystem")

class MenuPage extends ManagerPage {
    onInstallClicked;
    onUpdateClicked;
    onManageClicked;

    constructor(options) {
        super(options);
    }

    render(str) {
        const element = this.getElement();
        element.innerHTML = str;

        element.querySelector(".install").addEventListener("click", (e) => this.onInstallClicked(e));
        element.querySelector(".manage").addEventListener("click", (e) => this.onManageClicked(e));

        super.render();
    }    

    show() {
        this.instance = this.options.instance;

        ejs.renderFile("./ejs/menu.ejs", this.options, {}, (err, str) => {
            if (!err) {
                this.render(str);
            } else {
                logger.error(err);
            }
        });

        super.show();
    }
} 

module.exports = MenuPage;