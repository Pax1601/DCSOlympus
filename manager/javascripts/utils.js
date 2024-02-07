

async function sleep(ms) {
    await new Promise(r => setTimeout(r, ms));
    return true;
}

module.exports = {
    sleep: sleep
}