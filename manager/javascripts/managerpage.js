class ManagerPage {
    manager;
    element;
    options;
    previousPage;

    constructor(manager, options) {
        this.manager = manager;
        this.options = options ?? {};
        this.element = document.createElement('div');
        this.element.classList.add("manager-page", "hide");
    }

    getElement() {
        return this.element;
    }

    show(previousPage) {
        this.element.classList.remove("hide");

        if (previousPage !== undefined) 
            this.previousPage = previousPage;
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

        /* Connect the back, next and cancel buttons */
        if (this.element.querySelector(".back"))
            this.element.querySelector(".back").addEventListener("click", (e) => this.onBackClicked(e));

        if (this.element.querySelector(".next"))
            this.element.querySelector(".next").addEventListener("click", (e) => this.onNextClicked(e));

        if (this.element.querySelector(".cancel"))
            this.element.querySelector(".cancel").addEventListener("click", (e) => this.onCancelClicked(e));
    }

    onBackClicked() {
        this.hide();
        this.previousPage.show()
    }
} 

module.exports = ManagerPage;