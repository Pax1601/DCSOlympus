const ManagerPage = require("./managerpage");
const ejs = require('ejs')

class ManagerInstances extends ManagerPage {
    onBackClicked;
    onNextClicked;
    onCancelClicked;

    constructor(options) {
        super(options);
    }

    render(str) {
        this.element.innerHTML = str;

        var options = this.element.querySelectorAll(".option");
        for (let i = 0; i < options.length; i++) {
            options[i].onclick = (e) => {this.onOptionClicked(e);}
        }

        this.element.querySelector(".back").addEventListener("click", (e) => this.onBackClicked(e));
        this.element.querySelector(".next").addEventListener("click", (e) => this.onNextClicked(e));
        this.element.querySelector(".cancel").addEventListener("click", (e) => this.onCancelClicked(e));
    }    

    onOptionClicked(e) {
        var options = this.element.querySelectorAll(".option");
        for (let i = 0; i < options.length; i++) {
            options[i].classList.remove("selected");
        }

        e.target.classList.add("selected");
    }

    getSelectedInstance() {
        return this.options.instances.find((instance) => {
            const selected = this.element.querySelector(".selected");
            return selected? selected.dataset.folder === instance.folder: false;
        });
    }

    show() {
        ejs.renderFile("./ejs/managerinstances.ejs", this.options, {}, (err, str) => {
            if (!err) {
                this.render(str);
            } else {
                console.error(err);
            }
        });

        super.show();
    }
} 

module.exports = ManagerInstances;