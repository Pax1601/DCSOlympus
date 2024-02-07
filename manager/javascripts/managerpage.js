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

        this.previousPage = ignorePreviousPage ? this.previousPage : this.manager.activePage;
        this.manager.activePage = this;

        if (this.options.onShow) 
            this.options.onShow();
    }

    hide() {
        this.element.style.opacity = "0%";
        window.setTimeout(() => {
            this.element.classList.add("hide");
        }, 250);        
    }

    render(str) { 
        this.element.innerHTML = str;
        this.element.style.opacity = "0%";

        this.element.classList.remove("hide");
        window.setTimeout(() => {
            this.element.style.opacity = "100%";
        }, 0)

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