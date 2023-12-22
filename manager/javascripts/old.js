
function showPopup(message, otherButton, otherButtonCallback) {
    var data = {
        message: message,
        otherButton: otherButton
    };

    var popups = document.querySelectorAll(".popup");

    for (let i = 0; i < popups.length; i++) {
        document.body.removeChild(popups[i])
    }

    ejs.renderFile("./ejs/popup.ejs", data, {}, (err, str) => {
        var div = document.createElement("div");
        div.classList.add("popup");
        div.innerHTML = str;
        document.body.appendChild(div);

        div.querySelector(".apply").addEventListener("click", () => {
            document.body.removeChild(div);
        })

        div.querySelector(".other").addEventListener("click", () => {
            otherButtonCallback();
        })
    });
}


class InstanceDiv {
    element = null;
    parent = null;
    folder = "";

    constructor(parent, folder) {
        this.element = parent;
        this.folder = folder;
        this.render();
    }

    render() {
        this.element = document.createElement("div");

        var data = {
            folder: this.folder,
            installed: false,
            index: instanceDivs.length * 10
        };

        var newVersionInfo = vi(path.join("..", "mod", "bin", "olympus.dll"));
        data["newVersion"] = newVersionInfo.ProductVersion;
        data["version"] = "n/a";

        if (fs.existsSync(path.join(this.folder, "Config", "olympus.json"))) {
            var config = JSON.parse(fs.readFileSync(path.join(this.folder, "Config", "olympus.json")));
            data = {
                ...data,
                ...config
            }
            data["installed"] = true;

            try {
                data["version"] = vi(path.join(this.folder, "Mods", "Services", "Olympus", "bin", "olympus.dll")).ProductVersion;
            } catch (e) {
                data["version"] = "n/a";
            }
        }

        ejs.renderFile("./ejs/instanceDiv.ejs", data, {}, (err, str) => {
            this.element.innerHTML = str;
            this.element.querySelector(".add").addEventListener("click", (e) => {
                if (!e.srcElement.classList.contains("disabled")) {
                    showPopup("Please wait while Olympus is being installed");
                    window.setTimeout(() => {
                        if (installOlympus(this.folder)) {
                            showPopup("Olympus installed successfully. Use the provided form to set Olympus properties. All fields are mandatory. Click on \"Create desktop shortcuts\" to generate Olympus shortcuts on your desktop.", "Create desktop shortcuts", () => {
                                createDesktopShortcuts(this.folder);
                            });
                        } else {
                            showPopup("An error has occurred during installation");
                        }
                    }, 100);
                }
            });

            this.element.querySelector(".remove").addEventListener("click", (e) => {
                if (!e.srcElement.classList.contains("disabled")) {
                    showPopup("Please wait while Olympus is being uninstalled from DCS instance");
                    window.setTimeout(() => {
                        if (uninstallOlympus(this.folder)) {
                            showPopup("Olympus uninstalled successfully from DCS instance!");
                        } else {
                            showPopup("An error has occurred during uninstallation");
                        }
                    }, 100);
                }
            });

            this.element.querySelector(".apply").addEventListener("click", (e) => {
                e.srcElement.classList.remove("blink");
                if (!e.srcElement.classList.contains("disabled")) {
                    showPopup("Please wait while the configuration is being applied");
                    window.setTimeout(() => {
                        if (applyConfiguration(this.folder, this.getFields())) {
                            showPopup("Olympus configuration applied successfully!");
                        } else {
                            showPopup("An error has occurred while applying the configuration");
                        }
                    }, 100)
                }
            });

            this.element.querySelector(".update").addEventListener("click", (e) => {
                if (!e.srcElement.classList.contains("disabled")) {
                    showPopup("Please wait while Olympus is being updated in the DCS instance");
                    window.setTimeout(() => {
                        if (updateOlympus(this.folder)) {
                            showPopup("Olympus updated successfully from DCS instance!");
                        } else {
                            showPopup("An error has occurred during the update");
                        }
                    }, 100);
                }
            });

            var inputs = this.element.querySelectorAll("input");
            for (let i = 0; i < inputs.length; i++) {
                inputs[i].addEventListener("change", () => {
                    inputs[i].classList.remove("error");
                    instanceDivs.forEach((instanceDiv) => instanceDiv.checkFields())
                })
            }
        });
    }

    getDiv() {
        return this.element;
    }

    getFields() {
        return {
            clientPort: Number(this.element.querySelector("#client-port").value),
            backendPort: Number(this.element.querySelector("#backend-port").value),
            backendAddress: this.element.querySelector("#backend-address").value,
            gameMasterPassword: this.element.querySelector("#game-master-password").value,
            blueCommanderPassword: this.element.querySelector("#blue-commander-password").value,
            redCommanderPassword: this.element.querySelector("#red-commander-password").value,
        }
    }

    checkFields() {
        var data = this.getFields();

        /* Clear existing errors */
        var inputs = this.element.querySelectorAll("input");
        for (let i = 0; i < inputs.length; i++) {
            inputs[i].classList.remove("error");
        }
        var messages = this.element.querySelectorAll(".error");
        for (let i = 0; i < messages.length; i++) {
            messages[i].innerText = "";
        }

        /* Enable the button */
        this.element.querySelector(".apply").classList.remove("disabled");

        if (data["clientPort"] !== 0 && data["backendPort"] !== 0) {
            if (data["clientPort"] === data["backendPort"]) {
                this.element.querySelector("#client-port").classList.add("error");
                this.element.querySelector("#client-port-error").innerText = "Ports must be different";
                this.element.querySelector("#backend-port").classList.add("error");
                this.element.querySelector("#backend-port-error").innerText = "Ports must be different";
                this.element.querySelector(".apply").classList.add("disabled");
            }
            else {
                checkPort(data["clientPort"], (res) => {
                    var otherInstanceUsesPort = instanceDivs.find((instanceDiv) => {
                        if (instanceDiv != this) {
                            var fields = instanceDiv.getFields();
                            if (fields["clientPort"] === data["clientPort"] || fields["backendPort"] === data["clientPort"]) {
                                return true;
                            }
                        }
                    })

                    if (!res || otherInstanceUsesPort) {
                        this.element.querySelector("#client-port").classList.add("error");
                        this.element.querySelector("#client-port-error").innerText = "Port already in use";
                        this.element.querySelector(".apply").classList.add("disabled");
                    }
                });

                checkPort(data["backendPort"], (res) => {
                    var otherInstanceUsesPort = instanceDivs.find((instanceDiv) => {
                        if (instanceDiv != this) {
                            var fields = instanceDiv.getFields();
                            if (fields["clientPort"] === data["backendPort"] || fields["backendPort"] === data["backendPort"]) {
                                return true;
                            }
                        }
                    })

                    if (!res || otherInstanceUsesPort) {
                        this.element.querySelector("#backend-port").classList.add("error");
                        this.element.querySelector("#backend-port-error").innerText = "Port already in use";
                        this.element.querySelector(".apply").classList.add("disabled");
                    }
                });
            }
        }

        if (data["gameMasterPassword"] !== "" && data["blueCommanderPassword"] !== "" && data["gameMasterPassword"] === data["blueCommanderPassword"]) {
            this.element.querySelector("#game-master-password").classList.add("error");
            this.element.querySelector("#game-master-password-error").innerText = "Passwords must be different";
            this.element.querySelector("#blue-commander-password").classList.add("error");
            this.element.querySelector("#blue-commander-password-error").innerText = "Passwords must be different";
            this.element.querySelector(".apply").classList.add("disabled");
        }

        if (data["gameMasterPassword"] !== "" && data["redCommanderPassword"] !== "" && data["gameMasterPassword"] === data["redCommanderPassword"]) {
            this.element.querySelector("#game-master-password").classList.add("error");
            this.element.querySelector("#game-master-password-error").innerText = "Passwords must be different";
            this.element.querySelector("#red-commander-password").classList.add("error");
            this.element.querySelector("#red-commander-password-error").innerText = "Passwords must be different";
            this.element.querySelector(".apply").classList.add("disabled");
        }

        if (data["blueCommanderPassword"] !== "" && data["redCommanderPassword"] !== "" && data["blueCommanderPassword"] === data["redCommanderPassword"]) {
            this.element.querySelector("#blue-commander-password").classList.add("error");
            this.element.querySelector("#blue-commander-password-error").innerText = "Passwords must be different";
            this.element.querySelector("#red-commander-password").classList.add("error");
            this.element.querySelector("#red-commander-password-error").innerText = "Passwords must be different";
            this.element.querySelector(".apply").classList.add("disabled");
        }

        if (data["gameMasterPassword"] === "" || data["blueCommanderPassword"] === "" || data["redCommanderPassword"] === "") {
            this.element.querySelector(".apply").classList.add("disabled");
        }
    }
}

function loadDivs() {
    regedit.list(shellFoldersKey, function (err, result) {
        if (err) {
            console.log(err);
        }
        else {
            if (result[shellFoldersKey] !== undefined && result[shellFoldersKey]["exists"] && result[shellFoldersKey]['values'][saveGamesKey] !== undefined && result[shellFoldersKey]['values'][saveGamesKey]['value'] !== undefined) {
                const searchpath = result[shellFoldersKey]['values'][saveGamesKey]['value'];
                const folders = fs.readdirSync(searchpath);
                instanceDivs = [];
                const mainDiv = document.getElementById("main-div");

                folders.forEach((folder) => {
                    if (fs.existsSync(path.join(searchpath, folder, "Config", "appsettings.lua")) ||
                        fs.existsSync(path.join(searchpath, folder, "Config", "serversettings.lua"))) {
                        instanceDivs.push(new InstanceDiv(mainDiv, path.join(searchpath, folder)));
                    }
                });

                mainDiv.replaceChildren(...instanceDivs.map((instanceDiv) => {
                    return instanceDiv.getDiv();
                }));

                instanceDivs.forEach((instanceDiv) => instanceDiv.checkFields())

            } else {
                console.error("An error occured while trying to fetch the location of the DCS folders.")
            }
        }
    })
}