const ManagerPage = require("./managerpage");
const ejs = require('ejs')
const { logger } = require("./filesystem")
const fs = require("fs");
const { showErrorPopup } = require("./popup");

class WelcomePage extends ManagerPage {
    constructor(manager, options) {
        super(manager, options);
    }

    render(str) {
        const element = this.getElement();
        element.innerHTML = str;

        element.querySelector(".basic").addEventListener("click", (e) => this.onbasicClicked(e));
        element.querySelector(".advanced").addEventListener("click", (e) => this.onAdvancedClicked(e));

        super.render();
    }    

    show(previousPage) {
        ejs.renderFile("./ejs/welcome.ejs", {...this.options, ...this.manager.options}, {}, (err, str) => {
            if (!err) {
                this.render(str);
            } else {
                logger.error(err);
            }
        });

        super.show(previousPage);
    }

    onbasicClicked(e) {
        this.createOptionsFile("basic");
    }

    onAdvancedClicked(e) {
        this.createOptionsFile("advanced");
    }

    createOptionsFile(mode) {
        try {
            fs.writeFileSync("options.json", JSON.stringify({mode: mode}));
            location.reload();
        } catch (e) {
            showErrorPopup(`A critical error occurred, check ${this.manager.options.logLocation} for more info.`)
        }
    }
} 

module.exports = WelcomePage;