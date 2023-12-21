const ManagerPage = require("./managerpage");
const ejs = require('ejs')

class ManagerInstallations extends ManagerPage {
    constructor(options) {
        super(options);

        ejs.renderFile("./ejs/managerinstallations.ejs", options, {}, (err, str) => {
            if (!err) {
                this.render(str);
            } else {
                console.error(str);
            }
        });
    }

    render(str) {
        const element = this.getElement();
        element.innerHTML = str;

        var options = element.querySelectorAll(".option");
        for (let i = 0; i < options.length; i++) {
            options[i].onclick = (e) => {this.onOptionClicked(e);}
        }
    }    

    onOptionClicked(e) {
        e.target.classList.toggle("selected")
    }
} 

module.exports = ManagerInstallations;