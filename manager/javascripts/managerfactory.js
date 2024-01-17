/* TODO: find a better solution without using the window object to persist the manager singleton */

function getManager() {
    if (window.manager) {
        return window.manager;
    } else {
        const Manager = require("./manager");
        window.manager = new Manager();
        return window.manager;
    }
}

module.exports = {
    getManager: getManager
};