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

        var editButtons = this.element.querySelectorAll(".edit");
        for (let i = 0; i < editButtons.length; i++) {
            editButtons[i].onclick = (e) => {this.onEditClicked(e);}
        }

        var uninstallButtons = this.element.querySelectorAll(".uninstall");
        for (let i = 0; i < uninstallButtons.length; i++) {
            uninstallButtons[i].onclick = (e) => {this.onUninstallClicked(e);}
        }

        var startStopServerButtons = this.element.querySelectorAll(".start-stop-server");
        for (let i = 0; i < startStopServerButtons.length; i++) {
            startStopServerButtons[i].onclick = (e) => {this.onStartStopServerClicked(e);}
        }

        var startStopClientButtons = this.element.querySelectorAll(".start-stop-client");
        for (let i = 0; i < startStopClientButtons.length; i++) {
            startStopClientButtons[i].onclick = (e) => {this.onStartStopClientClicked(e);}
        }

        this.element.querySelector(".cancel").addEventListener("click", (e) => this.onCancelClicked(e));
    }    

    async onEditClicked(e) {
        logger.log(e.target.dataset.folder)
        this.setSelectedInstance((await DCSInstance.getInstances()).find((instance) => {return instance.folder === e.target.closest('.option').dataset.folder}));
    }

    async onStartStopServerClicked(e) {
        var instance = (await DCSInstance.getInstances()).find((instance) => {return instance.folder === e.target.closest('.option').dataset.folder});
        instance.webserverOnline? instance.stop(): instance.startServer();
    }

    async onStartStopClientClicked(e) {
        var instance = (await DCSInstance.getInstances()).find((instance) => {return instance.folder === e.target.closest('.option').dataset.folder});
        instance.webserverOnline? exec(`start http://localhost:${instance.clientPort}`): instance.startClient();
    }

    async onUninstallClicked(e) {
        var instance = (await DCSInstance.getInstances()).find((instance) => {return instance.folder === e.target.closest('.option').dataset.folder});
        instance.webserverOnline || instance.backendOnline? showErrorPopup("Error, the selected Olympus instance is currently active, please stop Olympus before uninstalling it!") : instance.uninstall();
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