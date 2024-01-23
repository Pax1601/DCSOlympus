const { logger } = require("./filesystem");
const ejs = require('ejs')

class ManagerPage {
    manager;
    ejsFile;
    element;
    options = {};
    previousPage;

    constructor(manager, ejsFile) {
        this.manager = manager;
        this.element = document.createElement('div');
        this.element.classList.add("manager-page", "hide");
        this.ejsFile = ejsFile;
        document.body.appendChild(this.element);
    }

    getElement() {
        return this.element;
    }

    show(ignorePreviousPage) {
        ejs.renderFile(this.ejsFile, {...this.options, ...this.manager.options}, {}, (err, str) => {
            if (!err) {
                this.render(str);
            } else {
                logger.error(err);
            }
        });

        this.element.classList.remove("hide");

        this.previousPage = ignorePreviousPage ? this.previousPage : this.manager.activePage;
        this.manager.activePage = this;
    }

    hide() {
        this.element.classList.add("hide");
    }

    render(str) {
        this.element.innerHTML = str;

        /* Connect all the collapsable buttons */
        let buttons = document.querySelectorAll(".button.collapse");
        for (let i = 0; i < buttons.length; i++) {
            buttons[i].addEventListener("click", () => {
                buttons[i].classList.toggle("open");
            })
        }   
    }
} 

module.exports = ManagerPage;