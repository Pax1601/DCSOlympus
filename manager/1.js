
        /* Get the list of DCS instances */
        var instances = await DCSInstance.getInstances();

        /* If there is only 1 DCS Instance and Olympus is not installed in it, go straight to the installation page (since there is nothing else to do) */
        this.basic = instances.length === 1 && !instances[0].installed;

        document.getElementById("loader").classList.add("hide");

        /* Check if there are corrupted or outdate instances */
        if (instances.some((instance) => {
            return instance.installed && instance.error;
        })) {
            /* Ask the user for confirmation */
            showErrorPopup("One or more Olympus instances are corrupted or need updating. Press Close to fix this.", async () => {
                showWaitPopup("Please wait while your instances are being fixed.")
                fixInstances(instances.filter((instance) => {
                    return instance.installed && instance.error;
                })).then(
                    () => { location.reload() },
                    (err) => { 
                        logger.error(err);
                        showErrorPopup(`An error occurred while trying to fix your installations. Please reinstall Olympus manually. <br><br> You can find more info in ${path.join(__dirname, "..", "manager.log")}`); 
                    }
                )
            })
        }

        /* Check which buttons should be enabled */
        const installEnabled = true;
        const manageEnabled = instances.some((instance) => { return instance.installed; });

        /* Menu */
        var menuPage = new MenuPage(this, { 
            installEnabled: installEnabled,
            manageEnabled: manageEnabled
        });
        
        /* Installations */
        this.installationPage = new installationPage(this, {
            instances: instances
        });
        
        /* Instances */
        this.instancesPage = new InstancesPage(this, {
            instances: instances.filter((instance) => { 
                return instance.installed; 
            })
        });
        
        /* Connections */
        this.connectionsPage = new ConnectionsPage(this);

        /* Passwords */
        this.passwordsPage = new PasswordsPage(this);

        /* Result */
        this.resultPage = new ResultPage(this, {
            logLocation: path.join(__dirname, "..", "manager.log")
        });

        /* Create all the HTML pages */
        document.body.appendChild(this.menuPage.getElement());
        document.body.appendChild(this.installationPage.getElement());
        document.body.appendChild(this.instancesPage.getElement());
        document.body.appendChild(this.connectionsPage.getElement());
        document.body.appendChild(this.passwordsPage.getElement());
        document.body.appendChild(this.resultPage.getElement());

        /* In basic mode we directly show the connections page */
        if (this.basic) {
            const options = {
                instance: instances[0],
                basic: this.basic,
                install: true
            }
            connectionsPage.options = {
                ...connectionsPage.options,
                ...options
            }
            passwordsPage.options = {
                ...passwordsPage.options,
                ...options
            }
            resultPage.options = {
                ...resultPage.options,
                ...options
            }

            /* Show the connections page directly */
            instancesPage.hide();
            connectionsPage.show();
        } else {
            /* Show the main menu */
            menuPage.show();
        }
    }