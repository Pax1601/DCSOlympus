const DCSInstance = require("./dcsinstance");
const ManagerPage = require("./managerpage");
const ejs = require('ejs');
const { showErrorPopup } = require("./popup");
const { exec } = require("child_process");
const { logger } = require("./filesystem")

class InstancesPage extends ManagerPage {
    startInstance;

    constructor(manager, options) {
        super(manager, options);
    }

    render(str) {
        this.element.innerHTML = str;

        var editButtons = this.element.querySelectorAll(".button.edit");
        for (let i = 0; i < editButtons.length; i++) {
            editButtons[i].onclick = (e) => {this.onEditClicked(e);}
        }

        var installButtons = this.element.querySelectorAll(".button.install");
        for (let i = 0; i < installButtons.length; i++) {
            installButtons[i].onclick = (e) => {this.onInstallClicked(e);}
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

        super.render();
    }    

    async onStartServerClicked(e) {
        e.target.closest(".collapse").classList.add("loading");
        this.getClickedInstance(e).then((instance) => instance.startServer());
    }

    async onStartClientClicked(e) {
        e.target.closest(".collapse").classList.add("loading");
        this.getClickedInstance(e).then(instance => instance.startClient());
    }

    async onOpenBrowserClicked(e) {
        this.getClickedInstance(e).then((instance) => exec(`start http://localhost:${instance.clientPort}`));
    }

    async onStopClicked(e) {
        this.getClickedInstance(e).then((instance) => instance.stop());
    }

    async onEditClicked(e) {
        this.getClickedInstance(e).then((instance) => { 
            if (instance.webserverOnline || instance.backendOnline) {
                showErrorPopup("Error, the selected Olympus instance is currently active, please stop Olympus before editing it!")
            } else {
                this.manager.options.activeInstance = instance;
                this.manager.options.install = false;
                this.manager.options.singleInstance = false;
                this.hide();
                this.manager.typePage.show(this);
            }
        });
    }

    async onInstallClicked(e) {
        this.getClickedInstance(e).then((instance) => { 
            this.manager.options.activeInstance = instance;
            this.manager.options.install = true;
            this.manager.options.singleInstance = false;
            this.hide();
            this.manager.typePage.show(this);
        });
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

    show(previousPage) {
        ejs.renderFile("./ejs/instances.ejs", {...this.options, ...this.manager.options}, {}, (err, str) => {
            if (!err) {
                this.render(str);
            } else {
                logger.error(err);
            }
        });

        var instanceDivs = this.element.querySelectorAll(`.option`);
        for (let i = 0; i < instanceDivs.length; i++) {
            var instanceDiv = instanceDivs[i];
            var instance = this.manager.options.instances.find((instance) => { return instance.folder === instanceDivs[i].dataset.folder;})
            if (instance) {
                instanceDiv.querySelector(".button.install").classList.toggle("hide", instance.installed);
                instanceDiv.querySelector(".button.start").classList.toggle("hide", !instance.installed)
                instanceDiv.querySelector(".button.uninstall").classList.toggle("hide", !instance.installed)
                instanceDiv.querySelector(".button.edit").classList.toggle("hide", !instance.installed)
            }
        }

        super.show(previousPage);
    }

    update() {

        var instanceDivs = this.element.querySelectorAll(`.option`);
        for (let i = 0; i < instanceDivs.length; i++) {
            var instance = this.manager.options.instances.find((instance) => { return instance.folder === instanceDivs[i].dataset.folder;})
            if (instance && instance.installed) {
                var instanceDiv = instanceDivs[i];
                if (instanceDiv.querySelector(".webserver.online") !== null) {
                    instanceDiv.querySelector(".webserver.online").classList.toggle("hide", !instance.webserverOnline)
                    instanceDiv.querySelector(".webserver.offline").classList.toggle("hide", instance.webserverOnline)
                    instanceDiv.querySelector(".backend.online").classList.toggle("hide", !instance.backendOnline)
                    instanceDiv.querySelector(".backend.offline").classList.toggle("hide", instance.backendOnline)

                    if (this.backendOnline) {
                        instanceDiv.querySelector(".fps .data").innerText = instance.fps;
                        instanceDiv.querySelector(".load .data").innerText = instance.load;
                    }

                    instanceDiv.querySelector(".button.start").classList.toggle("hide", instance.webserverOnline)
                    instanceDiv.querySelector(".button.uninstall").classList.toggle("hide", instance.webserverOnline)
                    instanceDiv.querySelector(".button.edit").classList.toggle("hide", instance.webserverOnline)
                    instanceDiv.querySelector(".button.open-browser").classList.toggle("hide", !instance.webserverOnline)
                    instanceDiv.querySelector(".button.stop").classList.toggle("hide", !instance.webserverOnline)

                    if (this.webserverOnline) 
                        instanceDiv.querySelector(".button.start").classList.remove("loading")
                }
            }
        }
    
    }
} 

module.exports = InstancesPage;