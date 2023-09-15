import path from "path";
import { Manager } from "../other/manager";
import { getApp } from "..";

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
                    eval(xhr.response);
                    const plugin = globalThis.getOlympusPlugin() as OlympusPlugin;
                    console.log(plugin.getName() + " loaded correctly");
                    
                    if (plugin.initialize(getApp())) {
                        console.log(plugin.getName() + " initialized correctly");
                        this.add(pluginName, plugin);
                    }

                } else {
                    console.error(`Error retrieving plugin from ${pluginName}`)
                }
            };
            xhr.send();
        })
    }
}