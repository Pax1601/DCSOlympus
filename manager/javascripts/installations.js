const DCSInstance = require("./dcsinstance");
const ManagerPage = require("./managerpage");
const ejs = require('ejs')
const { logger } = require("./filesystem");
const { showConfirmPopup } = require("./popup");

class installationPage extends ManagerPage {
    constructor(manager, options) {
        super(manager, options);
    }

    render(str) {
        this.element.innerHTML = str;

        var options = this.element.querySelectorAll(".option");
        for (let i = 0; i < options.length; i++) {
            options[i].onclick = (e) => {this.onOptionClicked(e);}
        }

        if (this.element.querySelector(".cancel"))
            this.element.querySelector(".cancel").addEventListener("click", (e) => this.onCancelClicked(e));

        super.render();
    }    

    async onOptionClicked(e) {
        this.onInstanceSelection((await DCSInstance.getInstances()).find((instance) => {return instance.folder === e.target.dataset.folder}));
    }

    show(previousPage) {
        ejs.renderFile("./ejs/installations.ejs", {...this.options, ...this.manager.options}, {}, (err, str) => {
            if (!err) {
                this.render(str);
            } else {
                logger.error(err);
            }
        });

        super.show(previousPage);
    }

    onInstanceSelection(activeInstance) {
        this.manager.options.activeInstance = activeInstance;
        this.manager.options.install = !activeInstance.installed;

        /* Show the connections page */
        if (!activeInstance.installed || !this.managers.options.install) {
            this.hide();
            this.manager.typePage.show(this);
        } else {
            showConfirmPopup("<div style='font-size: 18px; max-width: 100%'> Olympus is already installed in this instance! </div> If you click Accept, it will be installed again and all changes, e.g. custom databases or mods support, will be lost. Are you sure you want to continue?",
                () => {
                    this.hide();
                    this.manager.typePage.show(this);
                }
            )
        }
    }

    onCancelClicked(e) {
        /* Go back to the main menu */
        this.hide();
        this.manager.menuPage.show();
    }
} 

module.exports = installationPage;