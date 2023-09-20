const express = require('express');
const fs = require('fs');
const path = require('path'); 

const pluginsDirectory = "./public/plugins"

const router = express.Router();

function listDirectories(source) {
    const directories = fs.readdirSync(source, { withFileTypes: true })
    .filter(dirent => dirent.isDirectory())
    .map(dirent => dirent.name);

    return directories;    
}

router.get('/list', function (req, res) {
    var directories = listDirectories(pluginsDirectory);
    console.log(directories)
    res.send(directories.filter(directory => fs.existsSync(path.join(pluginsDirectory, directory))));
});

module.exports = router;
