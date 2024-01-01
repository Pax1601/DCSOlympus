const ManagerPage = require("./managerpage");
const ejs = require('ejs')

class PasswordsPage extends ManagerPage {
    onBackClicked;
    onNextClicked;
    onCancelClicked;

    constructor(options) {
        super(options);
    }

    render(str) {
        const element = this.getElement();
        element.innerHTML = str;

        if (this.element.querySelector(".back"))
            this.element.querySelector(".back").addEventListener("click", (e) => this.onBackClicked(e));

        if (this.element.querySelector(".next"))
            this.element.querySelector(".next").addEventListener("click", (e) => this.onNextClicked(e));

        if (this.element.querySelector(".cancel"))
            this.element.querySelector(".cancel").addEventListener("click", (e) => this.onCancelClicked(e));

        this.element.querySelector(".game-master").querySelector("input").addEventListener("change", async (e) => { this.instance.setGameMasterPassword(e.target.value); })
        this.element.querySelector(".blue-commander").querySelector("input").addEventListener("change", async (e) => { this.instance.setBlueCommanderPassword(e.target.value); })
        this.element.querySelector(".red-commander").querySelector("input").addEventListener("change", async (e) => { this.instance.setRedCommanderPassword(e.target.value); })
    }    

    show() {
        this.instance = this.options.instance;

        ejs.renderFile("./ejs/passwords.ejs", this.options, {}, (err, str) => {
            if (!err) {
                this.render(str);
            } else {
                console.error(err);
            }
        });

        super.show();
    }
} 

module.exports = PasswordsPage;