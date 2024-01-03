const portfinder = require('portfinder')

/** Checks if a port is already in use
 * 
 */
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
    checkPort: checkPort,
    fetchWithTimeout: fetchWithTimeout
}
