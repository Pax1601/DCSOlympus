var manager = null;

function getManager() {
    if (manager) {
        return manager;
    } else {
        const Manager = require("./manager");
        manager = new Manager();
        return manager;
    }
}

module.exports = {
    getManager: getManager
};