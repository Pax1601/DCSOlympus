const portfinder = require('portfinder');
const { logger } = require('./filesystem');

/** Checks if a port is already in use
 * 
 */
async function checkPort(port) {
    try{
        await portfinder.getPortPromise({ port: port, stopPort: port });
        return true;
    } catch (err) {
        logger.log(err);
        return false;
    }
}

async function getFreePort(startPort) {
    try{
        var port = await portfinder.getPortPromise({ port: startPort });
        return port;
    } catch (err) {
        logger.log(err);
        return false;
    }
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
    fetchWithTimeout: fetchWithTimeout
}
