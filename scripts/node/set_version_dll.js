const path = require("path");
const fs   = require("fs");
let files  = [];

const revision = require('child_process').execSync('git rev-parse --short HEAD').toString().trim();

function throughDirectory(directory) {
    fs.readdirSync(directory).forEach(file => {
        const absolute = path.join(directory, file);
        if (!file.includes("increase_version.js") && !file.includes("node_modules")) {
            if (fs.statSync(absolute).isDirectory()) 
            {
                return throughDirectory(absolute);
            }
            else {
                return files.push(absolute);
            }
        }
    });
}

fs.readFile("./version.json", "utf8", (error, data) => {
    if (error) {
      console.log(error);
      return;
    }
    const versionJSON = JSON.parse(data);
    var version = versionJSON["version"];
    console.log(`Setting version number to ${version}`);
    version = version.replace("v", "");
    var arr = version.split(".");
    const major = arr[0];
    const minor = arr[1];
    const minorminor = arr[2];

	throughDirectory("./backend");

    files.forEach((file) => {
        fs.readFile(file, 'utf8', function (err,data) {
            var fileChanged = false;
            if (err) {
                return console.log(err);
            }

            if (data.search(/FILEVERSION \d,\d,\d/g) >= 0) {
                console.log(`Replacing version in ${file}`);
                var data = data.replace(/FILEVERSION \d,\d,\d/g, `FILEVERSION ${major},${minor},${minorminor}`);
                fileChanged = true;
            }

            if (data.search(/VALUE "FileVersion", "\d.\d.\d.0"/g) >= 0) {
                console.log(`Replacing version in ${file}`);
                data = data.replace(/VALUE "FileVersion", "\d.\d.\d.0"/g, `VALUE "FileVersion", "${major}.${minor}.${minorminor}.0"`);
                fileChanged = true;
            }
			
			if (data.search(/VALUE "ProductVersion", "\d.\d.\d.0"/g) >= 0) {
                console.log(`Replacing version in ${file}`);
                data = data.replace(/VALUE "ProductVersion", "\d.\d.\d.0"/g, `VALUE "ProductVersion", "${major}.${minor}.${minorminor}.0"`);
                fileChanged = true;
            }

            if (fileChanged) {
                fs.writeFile(file, data, 'utf8', (err) => {
                    if (err) return console.log(err);
                });
            }
        });
    });
});


