class ManagerPage {
    element;
    options;

    constructor(options) {
        this.options = options ?? {};
        this.element = document.createElement('div');
        this.element.classList.add("manager-page", "hide");
    }

    getElement() {
        return this.element;
    }

    show() {
        this.element.classList.remove("hide");
    }

    hide() {
        this.element.classList.add("hide");
    }

    render() {
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