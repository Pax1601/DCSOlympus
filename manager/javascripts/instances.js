const DCSInstance = require("./dcsinstance");
const ManagerPage = require("./managerpage");
const ejs = require('ejs');
const { showErrorPopup } = require("./popup");
const { exec } = require("child_process");
const { logger } = require("./filesystem")

class InstancesPage extends ManagerPage {
    onCancelClicked;
    setSelectedInstance;
    startInstance;

    constructor(options) {
        super(options);
    }

    render(str) {
        this.element.innerHTML = str;

        var editButtons = this.element.querySelectorAll(".button.edit");
        for (let i = 0; i < editButtons.length; i++) {
            editButtons[i].onclick = (e) => {this.onEditClicked(e);}
        }

        var uninstallButtons = this.element.querySelectorAll(".button.uninstall");
        for (let i = 0; i < uninstallButtons.length; i++) {
            uninstallButtons[i].onclick = (e) => {this.onUninstallClicked(e);}
        }

        var startServerButtons = this.element.querySelectorAll(".button.start-server");
        for (let i = 0; i < startServerButtons.length; i++) {
            startServerButtons[i].onclick = (e) => {this.onStartServerClicked(e);}
        }

        var startClientButtons = this.element.querySelectorAll(".button.start-client");
        for (let i = 0; i < startClientButtons.length; i++) {
            startClientButtons[i].onclick = (e) => {this.onStartClientClicked(e);}
        }

        var openBrowserButtons = this.element.querySelectorAll(".button.open-browser");
        for (let i = 0; i < openBrowserButtons.length; i++) {
            openBrowserButtons[i].onclick = (e) => {this.onOpenBrowserClicked(e);}
        }

        var stopButtons = this.element.querySelectorAll(".button.stop");
        for (let i = 0; i < stopButtons.length; i++) {
            stopButtons[i].onclick = (e) => {this.onStopClicked(e);}
        }

        this.element.querySelector(".cancel").addEventListener("click", (e) => this.onCancelClicked(e));

        super.render();
    }    

    async onEditClicked(e) {
        this.getClickedInstance(e).then((instance) => {
            instance.webserverOnline || instance.backendOnline? showErrorPopup("Error, the selected Olympus instance is currently active, please stop Olympus before editing it!") : 
            this.setSelectedInstance(instance);
            }
        );
    }

    async onStartServerClicked(e) {
        this.getClickedInstance(e).then((instance) => instance.startServer());
    }

    async onStartClientClicked(e) {
        this.getClickedInstance(e).then(instance => instance.startClient());
    }

    async onOpenBrowserClicked(e) {
        this.getClickedInstance(e).then((instance) => exec(`start http://localhost:${instance.clientPort}`));
    }

    async onStopClicked(e) {
        this.getClickedInstance(e).then((instance) => instance.stop());
    }

    async onUninstallClicked(e) {
        this.getClickedInstance(e).then((instance) => { 
            instance.webserverOnline || instance.backendOnline? showErrorPopup("Error, the selected Olympus instance is currently active, please stop Olympus before uninstalling it!") : instance.uninstall();
        });
    }

    async getClickedInstance(e) {
        return DCSInstance.getInstances().then((instances) => {
            return instances.find((instance) => {
                return instance.folder === e.target.closest('.option').dataset.folder
            })
        });
    }

    show() {
        ejs.renderFile("./ejs/instances.ejs", this.options, {}, (err, str) => {
            if (!err) {
                this.render(str);
            } else {
                logger.error(err);
            }
        });

        super.show();
    }
} 

module.exports = InstancesPage;