const ManagerPage = require("./managerpage");
const ejs = require('ejs')
const { logger } = require("./filesystem")

/** Connections page, allows the user to set the ports and address for each Olympus instance
 * 
 */
class ConnectionsPage extends ManagerPage {
    constructor(manager, options) {
        super(manager, options);
    }

    render(str) {
        const element = this.getElement();
        element.innerHTML = str;

        if (this.element.querySelector(".button.auto"))
            this.element.querySelector(".button.auto").addEventListener("click", (e) => this.onOptionSelected(true));

        if (this.element.querySelector(".button.manual"))
            this.element.querySelector(".button.manual").addEventListener("click", (e) => this.onOptionSelected(false));

        if (this.element.querySelector(".client-port"))
            this.element.querySelector(".client-port").querySelector("input").addEventListener("change", async (e) => { this.setClientPort(Number(e.target.value)); })

        if (this.element.querySelector(".backend-port"))
            this.element.querySelector(".backend-port").querySelector("input").addEventListener("change", async (e) => { this.setBackendPort(Number(e.target.value)); })

        if (this.element.querySelector(".backend-address"))
            this.element.querySelector(".backend-address").querySelector("input").addEventListener("change", async (e) => { this.manager.getActiveInstance().setBackendAddress(e.target.value); })

        super.render();
    }

    show(previousPage) {
        ejs.renderFile("./ejs/connections.ejs", {...this.options, ...this.manager.options}, {}, (err, str) => {
            if (!err) {
                this.render(str);

                /* Call the port setters to check if the ports are free */
                this.setClientPort(this.manager.getActiveInstance().clientPort);
                this.setBackendPort(this.manager.getActiveInstance().backendPort);
            } else {
                logger.error(err);
            }
        });

        super.show(previousPage);
    }

    onNextClicked() {
        this.hide();
        this.manager.passwordsPage.show(this);
    }

    onCancelClicked() {
        this.hide();
        this.manager.menuPage.show()
    }

    onOptionSelected(auto) {
        this.options.selectAutoOrManual = false;
        this.options.auto = auto;
        if (auto) {

        } else {
            this.show();
        }
    }

    /** Asynchronously check if the client port is free and if it is, set the new value
     * 
     */
    async setClientPort(newPort) {
        const success = await this.manager.getActiveInstance().setClientPort(newPort);
        var successEls = this.element.querySelector(".client-port").querySelectorAll(".success");
        for (let i = 0; i < successEls.length; i++) {
            successEls[i].classList.toggle("hide", !success);
        }
        var errorEls = this.element.querySelector(".client-port").querySelectorAll(".error");
        for (let i = 0; i < errorEls.length; i++) {
            errorEls[i].classList.toggle("hide", success);
        }
    }

    /** Asynchronously check if the backend port is free and if it is, set the new value
     * 
     */
    async setBackendPort(newPort) {
        const success = await this.manager.getActiveInstance().setBackendPort(newPort);
        var successEls = this.element.querySelector(".backend-port").querySelectorAll(".success");
        for (let i = 0; i < successEls.length; i++) {
            successEls[i].classList.toggle("hide", !success);
        }
        var errorEls = this.element.querySelector(".backend-port").querySelectorAll(".error");
        for (let i = 0; i < errorEls.length; i++) {
            errorEls[i].classList.toggle("hide", success);
        }
    }
}

module.exports = ConnectionsPage;