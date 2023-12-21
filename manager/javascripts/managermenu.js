const ManagerPage = require("./managerpage");
const ejs = require('ejs')

class ManagerMenu extends ManagerPage {
    constructor(options) {
        super(options);

        ejs.renderFile("./ejs/managermenu.ejs", options, {}, (err, str) => {
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
    }    
} 

module.exports = ManagerMenu;