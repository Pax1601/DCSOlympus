const ManagerPage = require("./managerpage");
const ejs = require('ejs')
const { logger } = require("./filesystem")

class PasswordsPage extends ManagerPage {
    constructor(manager, options) {
        super(manager, options);
    }

    render(str) {
        const element = this.getElement();
        element.innerHTML = str;

        this.element.querySelector(".game-master").querySelector("input").addEventListener("change", async (e) => { this.manager.getActiveInstance().setGameMasterPassword(e.target.value); })
        this.element.querySelector(".blue-commander").querySelector("input").addEventListener("change", async (e) => { this.manager.getActiveInstance().setBlueCommanderPassword(e.target.value); })
        this.element.querySelector(".red-commander").querySelector("input").addEventListener("change", async (e) => { this.manager.getActiveInstance().setRedCommanderPassword(e.target.value); })

        super.render();
    }    

    show(previousPage) {
        ejs.renderFile("./ejs/passwords.ejs", {...this.options, ...this.manager.options}, {}, (err, str) => {
            if (!err) {
                this.render(str);
            } else {
                logger.error(err);
            }
        });

        super.show(previousPage);
    }

    onNextClicked() {
        this.hide();
        this.manager.resultPage.show();
        this.manager.resultPage.startInstallation();
    }

    onCancelClicked() {
        this.hide();
        this.manager.menuPage.show()
    }
} 

module.exports = PasswordsPage;