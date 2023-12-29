const ManagerPage = require("./managerpage");
const ejs = require('ejs')

class MenuPage extends ManagerPage {
    onInstallClicked;
    onUpdateClicked;
    onManageClicked;

    constructor(options) {
        super(options);

        ejs.renderFile("./ejs/menu.ejs", options, {}, (err, str) => {
            if (!err) {
                this.render(str);
            } else {
                console.error(err);
            }
        });
    }

    render(str) {
        const element = this.getElement();
        element.innerHTML = str;

        element.querySelector(".install").addEventListener("click", (e) => this.onInstallClicked(e));
        element.querySelector(".update").addEventListener("click", (e) => this.onUpdateClicked(e))
        element.querySelector(".manage").addEventListener("click", (e) => this.onManageClicked(e))
    }    
} 

module.exports = MenuPage;