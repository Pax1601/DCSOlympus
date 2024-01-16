const ManagerPage = require("./managerpage");
const ejs = require('ejs')

class WizardPage extends ManagerPage {
    contentEjsFile;

    constructor(manager, contentEjsFile) {
        super(manager, './ejs/wizard.ejs');
        this.contentEjsFile = contentEjsFile;
    }

    render(str) {
        super.render(str);

        /* Connect the back, next and cancel buttons */
        if (this.element.querySelector(".back"))
            this.element.querySelector(".back").addEventListener("click", (e) => this.onBackClicked(e));

        if (this.element.querySelector(".next"))
            this.element.querySelector(".next").addEventListener("click", (e) => this.onNextClicked(e));

        if (this.element.querySelector(".cancel"))
            this.element.querySelector(".cancel").addEventListener("click", (e) => this.onCancelClicked(e));

        ejs.renderFile(this.contentEjsFile, {...this.options, ...this.manager.options}, {}, (err, str) => {
            if (!err) {
                this.element.querySelector(".content").innerHTML = str;
            } else {
                logger.error(err);
            }
        });
    
    }

    onBackClicked() {
        console.log(this.previousPage)
        this.hide();
        this.previousPage.show()
    }

    onCancelClicked() {
        this.hide();
        if (this.manager.options.mode === "basic") {
            /* In basic mode no dashboard is shown */
            this.manager.menuPage.show();
        } else {
            /* In Expert mode we go directly to the dashboard */
            this.manager.instancesPage.show();
        }
    }
}

module.exports = WizardPage;