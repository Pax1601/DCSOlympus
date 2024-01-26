const portfinder = require('portfinder')
const { logger } = require("./filesystem")

/** Checks if a port is already in use
 * 
 */
function checkPortSync(port, callback) {
    portfinder.getPort({ port: port, stopPort: port }, (err, res) => {
        if (err !== null) {
            logger.error(`Port ${port} already in use`);
            callback(false);
        } else {
            callback(true);
        }
    });
}

function checkPort(port) {
    return portfinder.getPortPromise({ port: port, stopPort: port });
}

function getFreePort(startPort) {
    return portfinder.getPortPromise({ port: startPort });
}

/** Performs a fetch request, with a configurable timeout 
 * 
 */
async function fetchWithTimeout(resource, options = {}) {
    const { timeout = 8000 } = options;
    
    const controller = new AbortController();
    const id = setTimeout(() => controller.abort(), timeout);
  
    const response = await fetch(resource, {
      ...options,
      signal: controller.signal  
    });
    clearTimeout(id);
  
    return response;
}

module.exports = {
    getFreePort: getFreePort,
    checkPort: checkPort,
    checkPortSync: checkPortSync,
    fetchWithTimeout: fetchWithTimeout
}
