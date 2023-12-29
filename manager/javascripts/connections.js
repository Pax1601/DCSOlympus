const ManagerPage = require("./managerpage");
const ejs = require('ejs')

class ConnectionsPage extends ManagerPage {
    onBackClicked;
    onNextClicked;
    onCancelClicked;
    instance;

    constructor(options) {
        super(options);
    }

    render(str) {
        const element = this.getElement();
        element.innerHTML = str;

        this.element.querySelector(".back").addEventListener("click", (e) => this.onBackClicked(e));
        this.element.querySelector(".next").addEventListener("click", (e) => this.onNextClicked(e));
        this.element.querySelector(".cancel").addEventListener("click", (e) => this.onCancelClicked(e));

        this.element.querySelector(".client-port").querySelector("input").addEventListener("change", async (e) => { this.setClientPort(Number(e.target.value)); })
        this.element.querySelector(".backend-port").querySelector("input").addEventListener("change", async (e) => { this.setBackendPort(Number(e.target.value)); })
        this.element.querySelector(".backend-address").querySelector("input").addEventListener("change", async (e) => { this.instance.setBackendAddress(e.target.value); })
    }

    show() {
        this.instance = this.options.instance;

        ejs.renderFile("./ejs/connections.ejs", this.options, {}, (err, str) => {
            if (!err) {
                this.render(str);
                this.setClientPort(this.instance.clientPort);
                this.setBackendPort(this.instance.backendPort);
            } else {
                console.error(err);
            }
        });

        super.show();
    }

    async setClientPort(newPort) {
        const success = await this.instance.setClientPort(newPort);
        var successEls = this.element.querySelector(".client-port").querySelectorAll(".success");
        for (let i = 0; i < successEls.length; i++) {
            successEls[i].classList.toggle("hide", !success);
        }
        var errorEls = this.element.querySelector(".client-port").querySelectorAll(".error");
        for (let i = 0; i < errorEls.length; i++) {
            errorEls[i].classList.toggle("hide", success);
        }
    }

    async setBackendPort(newPort) {
        const success = await this.instance.setBackendPort(newPort);
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