import { IndexApp } from "../../indexapp";
import { OlympusApp } from "../../olympusapp";
import { Plugin } from "../../plugin/plugin";


export class PluginHelloWorld extends Plugin {

    constructor( olympusApp:OlympusApp ) {
        
        super( olympusApp, "HelloWorld" );

        const templates = {
            bar: `<div id="shortcut-bar"
                        style="
                            background-color:var( --background-steel );
                            border-radius:var( --border-radius-sm );
                            bottom:100px;
                            color:white;
                            display:flex;
                            font-size:12px;
                            justify-self:center;
                            padding:5px;
                            position:absolute;
                            z-index:999;">CTRL: Pin tool | SHIFT: box select tool</div>`
        }

        document.body.insertAdjacentHTML( "beforeend", templates.bar );

    }
}