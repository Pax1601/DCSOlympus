const { installMod, installHooks, installJSON, applyConfiguration, installShortCuts } = require("./filesystem");
const ManagerPage = require("./managerpage");
const ejs = require('ejs')

class ManagerResult extends ManagerPage {
    onBackClicked;
    onNextClicked;
    onCancelClicked;

    constructor(options) {
        super(options);
    }

    render(str) {
        const element = this.getElement();
        element.innerHTML = str;

        this.element.querySelector(".back").addEventListener("click", (e) => this.onBackClicked(e));
        this.element.querySelector(".cancel").addEventListener("click", (e) => this.onCancelClicked(e));
    }    

    show(instance) {
        this.instance = instance;
        this.options["instance"] = instance;

        ejs.renderFile("./ejs/managerresult.ejs", this.options, {}, (err, str) => {
            if (!err) {
                this.render(str);
            } else {
                console.error(err);
            }
        });

        super.show();
    }

    startInstallation() {
        installHooks(this.instance.folder).then(
            () => {
                this.applyStepSuccess(".hook");
            },
            (err) => {
                this.applyStepFailure(".hook");
                return Promise.reject(err);
            }
        ).then(() => installMod(this.instance.folder)).then(
            () => {
                this.applyStepSuccess(".mod");
            },
            (err) => {
                this.applyStepFailure(".mod");
                return Promise.reject(err);
            }
        ).then(() => installJSON(this.instance.folder)).then(
            () => {
                this.applyStepSuccess(".json");
            },
            (err) => {
                this.applyStepFailure(".json");
                return Promise.reject(err);
            }
        ).then(() => applyConfiguration(this.instance.folder, this.instance)).then(
            () => {
                this.applyStepSuccess(".config");
            },
            (err) => {
                this.applyStepFailure(".config");
                return Promise.reject(err);
            }
        ).then(() => installShortCuts(this.instance.folder, this.instance.name)).then(
            () => {
                this.applyStepSuccess(".shortcuts");
            },
            (err) => {
                this.applyStepFailure(".shortcuts");
                return Promise.reject(err);
            }
        ).then(
            () => {
                this.element.querySelector(".summary.success").classList.remove("hide");
                this.element.querySelector(".summary.error").classList.add("hide");
                this.element.querySelector(".info.success").classList.remove("hide");
                this.element.querySelector(".info.error").classList.add("hide");
                this.element.querySelector(".result .success").classList.remove("hide");
                this.element.querySelector(".result .error").classList.add("hide");
                this.element.querySelector(".result .wait").classList.add("hide");
                this.element.querySelector(".page-header").innerText = "Install successfull!";
            },
            () => {
                this.element.querySelector(".summary.success").classList.add("hide");
                this.element.querySelector(".summary.error").classList.remove("hide");
                this.element.querySelector(".result .success").classList.add("hide");
                this.element.querySelector(".result .error").classList.remove("hide");
                this.element.querySelector(".result .wait").classList.add("hide");
                this.element.querySelector(".page-header").innerText = "Install error!";
            }
        );
    }

    applyStepSuccess(step) {
        this.element.querySelector(step).querySelector(".success").classList.remove("hide");
        this.element.querySelector(step).querySelector(".error").classList.add("hide");
        this.element.querySelector(step).querySelector(".wait").classList.add("hide");
    }

    applyStepFailure(step) {
        this.element.querySelector(step).querySelector(".success").classList.add("hide");
        this.element.querySelector(step).querySelector(".error").classList.remove("hide");
        this.element.querySelector(step).querySelector(".wait").classList.add("hide");
    }
} 

module.exports = ManagerResult;