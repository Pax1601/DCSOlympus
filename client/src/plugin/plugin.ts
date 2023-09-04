import { OlympusApp } from "../olympusapp";
const templateParser = require( "ejs" );

export abstract class Plugin {

    #olympusApp!:OlympusApp;
    protected name = "";
    #templateParser:any;

    constructor( olympusApp:OlympusApp, pluginName:string ) {

        const regex = "^[a-zA-Z][a-zA-Z\d]{4,}"

        if ( new RegExp( regex ).test( pluginName ) === false ) {
            throw new Error( `Plugin names must match regex: ${regex}` );
        }

        this.name            = pluginName;
        this.#olympusApp     = olympusApp;
        this.#templateParser = templateParser;

    }

    getName() {
        return this.name;
    }

    getOlympusApp() {
        return this.#olympusApp;
    }

    getTemplateParser() {
        return this.#templateParser;
    }

}