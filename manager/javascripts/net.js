const portfinder = require('portfinder')

function checkPort(port, callback) {
    portfinder.getPort({ port: port, stopPort: port }, (err, res) => {
        if (err !== null) {
            console.error(`Port ${port} already in use`);
            callback(false);
        } else {
            callback(true);
        }
    });
}

module.exports = checkPort;
