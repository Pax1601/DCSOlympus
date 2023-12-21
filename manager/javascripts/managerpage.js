class ManagerPage {
    element;

    constructor(options) {
        this.element = document.createElement('div');
        this.element.classList.add("manager-page");
    }

    getElement() {
        return this.element;
    }

} 

module.exports = ManagerPage;