const ManagerPage = require("./managerpage");
const ejs = require('ejs')
const { logger } = require("./filesystem");
const { showConfirmPopup } = require("./popup");

class MenuPage extends ManagerPage {
    constructor(manager, options) {
        super(manager, options);
    }

    render(str) {
        const element = this.getElement();
        element.innerHTML = str;

        element.querySelector(".install").addEventListener("click", (e) => this.onInstallClicked(e));
        element.querySelector(".edit").addEventListener("click", (e) => this.onEditClicked(e));
        element.querySelector(".uninstall").addEventListener("click", (e) => this.onUninstallClicked(e));

        super.render();
    }    

    show(previousPage) {
        ejs.renderFile("./ejs/menu.ejs", {...this.options, ...this.manager.options}, {}, (err, str) => {
            if (!err) {
                this.render(str);
            } else {
                logger.error(err);
            }
        });

        super.show(previousPage);
    }

    /* When the install button is clicked go the installation page */
    onInstallClicked(e) {
        this.manager.options.install = true;
        
        if (this.manager.options.singleInstance) {
            this.manager.options.activeInstance = this.manager.options.instances[0];

            /* Show the connections page */
            if (!this.manager.options.activeInstance.installed) {
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
        } else {
            this.hide();
            this.manager.installationsPage.show(this);
        }
    }

    /* When the edit button is clicked go to the instances page */
    onEditClicked(e) {
        this.hide();
        this.manager.options.install = false;
        
        if (this.manager.options.singleInstance) {
            this.manager.options.activeInstance = this.manager.options.instances[0];
            this.manager.typePage.show(this);
        } else {
            this.manager.installationsPage.show(this);
        }
    }

    /* When the remove button is clicked go to the instances page */
    onUninstallClicked(e) {
        this.manager.options.install = false;
        
        if (this.manager.options.singleInstance) {
            this.manager.options.activeInstance = this.manager.options.instances[0];
            this.manager.options.activeInstance.uninstall();
        } else {
            // TODO select instance to remove
        }
    }

    
} 

module.exports = MenuPage;