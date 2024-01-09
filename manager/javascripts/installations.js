const DCSInstance = require("./dcsinstance");
const ManagerPage = require("./managerpage");
const ejs = require('ejs')
const { logger } = require("./filesystem")

class InstallationsPage extends ManagerPage {
    onCancelClicked;
    setSelectedInstance;

    constructor(options) {
        super(options);
    }

    render(str) {
        this.element.innerHTML = str;

        var options = this.element.querySelectorAll(".option");
        for (let i = 0; i < options.length; i++) {
            options[i].onclick = (e) => {this.onOptionClicked(e);}
        }

        this.element.querySelector(".cancel").addEventListener("click", (e) => this.onCancelClicked(e));

        super.render();
    }    

    async onOptionClicked(e) {
        this.setSelectedInstance((await DCSInstance.getInstances()).find((instance) => {return instance.folder === e.target.dataset.folder}));
    }

    show() {
        ejs.renderFile("./ejs/installations.ejs", this.options, {}, (err, str) => {
            if (!err) {
                this.render(str);
            } else {
                logger.error(err);
            }
        });

        super.show();
    }
} 

module.exports = InstallationsPage;