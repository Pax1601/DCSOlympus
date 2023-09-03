import { OlympusApp } from "../../olympusapp";
import { Plugin, PluginInterface } from "../../plugin/plugin";


export class PluginHelloWorld extends Plugin implements PluginInterface {

    constructor( olympusApp:OlympusApp ) {
        
        super( olympusApp, "HelloWorld" );

        const panel = this.getOlympusApp().getPanelsManager().get( "unitControl" );
        const em    = panel.getEventsManager();

        em.on( "show", {
            "callback": () => {
                console.log( "Showing unit control panel" );
            }
        });

        em.on( "hide", {
            "callback": () => {
                console.log( "Hiding unit control panel" );
            }
        });

        //const tpl = new ejs

    }
}