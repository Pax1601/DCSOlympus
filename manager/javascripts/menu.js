const ManagerPage = require("./managerpage");
const ejs = require('ejs')

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
        element.querySelector(".update").addEventListener("click", (e) => this.onUpdateClicked(e))
        element.querySelector(".manage").addEventListener("click", (e) => this.onManageClicked(e))
    }    

    show() {
        this.instance = this.options.instance;

        ejs.renderFile("./ejs/menu.ejs", this.options, {}, (err, str) => {
            if (!err) {
                this.render(str);
            } else {
                console.error(err);
            }
        });

        super.show();
    }
} 

module.exports = MenuPage;