const ManagerPage = require("./managerpage");
const ejs = require('ejs')
const { logger } = require("./filesystem")

/** Type of install page, allows the user to select single player or multi player installation
 * 
 */
class TypePage extends ManagerPage {
    constructor(manager, options) {
        super(manager, options);
    }

    render(str) {
        const element = this.getElement();
        element.innerHTML = str;

        this.element.querySelector(".singleplayer").addEventListener("click", (e) => this.onOptionSelected(false));
        this.element.querySelector(".multiplayer").addEventListener("click", (e) => this.onOptionSelected(true));

        super.render();
    }

    show(previousPage) {
        ejs.renderFile("./ejs/type.ejs", {...this.options, ...this.manager.options}, {}, (err, str) => {
            if (!err) {
                this.render(str);

            } else {
                logger.error(err);
            }
        });

        super.show(previousPage);
    }

    onCancelClicked() {
        this.hide();
        this.manager.menuPage.show()
    }

    onOptionSelected(multiplayer) {
        this.manager.options.multiplayer = multiplayer;
        this.hide();
        this.manager.connectionsPage.options.selectAutoOrManual = true;
        this.manager.connectionsPage.show(this);
    }
}

module.exports = TypePage;