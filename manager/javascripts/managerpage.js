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
} 

module.exports = ManagerPage;