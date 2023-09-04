import { OlympusApp } from "../../olympusapp";
import { Plugin } from "../../plugin/plugin";


export class PluginHelloWorld extends Plugin {

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

        const tpl = `
            <div id="hello-world">
                Hello world!
            </div>
        `;

        panel.getElement().innerHTML = this.getTemplateParser().render( tpl );

    }
}