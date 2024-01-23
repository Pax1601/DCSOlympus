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

        ejs.renderFile(this.contentEjsFile, {...this.options, ...this.manager.options}, {}, (err, str) => {
            if (!err) {
                this.element.querySelector(".content").innerHTML = str;
            } else {
                logger.error(err);
            }
        });
    
    }
}

module.exports = WizardPage;