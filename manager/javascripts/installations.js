const DCSInstance = require("./dcsinstance");
const ManagerPage = require("./managerpage");
const ejs = require('ejs')

class InstallationsPage extends ManagerPage {
    onCancelClicked;
    setSelectedInstance;

    constructor(options) {
        super(options);
    }

    render(str) {
        this.element.innerHTML = str;

        var options = this.element.querySelectorAll(".option");
        for (let i = 0; i < options.length; i++) {
            options[i].onclick = (e) => {this.onOptionClicked(e);}
        }

        this.element.querySelector(".cancel").addEventListener("click", (e) => this.onCancelClicked(e));
    }    

    async onOptionClicked(e) {
        this.setSelectedInstance((await DCSInstance.getInstances()).find((instance) => {return instance.folder === e.target.dataset.folder}));
    }

    show() {
        ejs.renderFile("./ejs/installations.ejs", this.options, {}, (err, str) => {
            if (!err) {
                this.render(str);
            } else {
                console.error(err);
            }
        });

        super.show();
    }
} 

module.exports = InstallationsPage;