import path from "path";
import { Manager } from "../other/manager";
import { getApp } from "..";
import { OlympusPlugin } from "../interfaces";

/** The plugins manager is responsible for loading and initializing all the plugins. Plugins are located in the public/plugins folder. 
 * Each plugin must be comprised of a single folder containing a index.js file. Each plugin must set the globalThis.getOlympusPlugin variable to
 * return a valid class implementing the OlympusPlugin interface.
  */

export class PluginsManager extends Manager {
    constructor() {
        super();

        var xhr = new XMLHttpRequest();
        xhr.open('GET', "/plugins/list", true);
        xhr.responseType = 'json';
        xhr.onload = () => {
            var status = xhr.status;
            if (status === 200) {
                this.#loadPlugins(xhr.response);
            } else {
                console.error(`Error retrieving plugins`)
            }
        };
        xhr.send();
    }

    #loadPlugins(pluginsFolders: string[]) {
        pluginsFolders.forEach((pluginName: string) => {
            var xhr = new XMLHttpRequest();
            xhr.open('GET', path.join("/plugins", pluginName, "index.js"), true);
            xhr.responseType = 'text';
            xhr.onload = () => {
                var status = xhr.status;
                if (status === 200) {
                    /* Inject the plugin style */
                    var link = document.createElement("link");
                    link.href = path.join("/plugins", pluginName, "style.css");
                    link.type = "text/css";
                    link.rel = "stylesheet";
                    document.getElementsByTagName("head")[0].appendChild(link);

                    /* Evaluate the plugin javascript */
                    var plugin: OlympusPlugin | null = null;
                    try {
                        eval(xhr.response);
                        plugin = globalThis.getOlympusPlugin() as OlympusPlugin;
                        console.log(plugin.getName() + " loaded correctly");
                    } catch (error: any) {
                        console.log("An error occured while loading a plugin from " + pluginName);
                        console.log(error);
                    }
                     
                    /* If the plugin was loaded, try to initialize it */
                    if (plugin != null) {
                        try {
                            if (plugin.initialize(getApp())) {
                                console.log(plugin.getName() + " initialized correctly");
                                this.add(pluginName, plugin);
                            }
                        } catch (error: any) {
                            console.log("An error occured while initializing a plugin from " + pluginName);
                            console.log(error);
                        }
                    }
                } else {
                    console.error(`Error retrieving plugin from ${pluginName}`)
                }
            };
            xhr.send();
        })
    }
}