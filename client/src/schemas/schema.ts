import Ajv, { JSONSchemaType } from "ajv";
import { AnySchemaObject, Schema } from "ajv/dist/core";


//  For future extension
abstract class JSONSchemaValidator {

    #schema!:AnySchemaObject;

    constructor( schema:AnySchemaObject ) {
        this.#schema = schema;
    }

    getSchema() {
        return this.#schema;
    }

}


export class AirbasesJSONSchemaValidator extends JSONSchemaValidator {

    constructor( ) {

        const schema = require("../schemas/airbases.schema.json");

        super( schema );

        const ajv = new Ajv({
            "allErrors": true
        });
        
        [
            require( "../../public/databases/airbases/caucasus.json" ),
            require( "../../public/databases/airbases/falklands.json" ),
            require( "../../public/databases/airbases/marianas.json" ),
            require( "../../public/databases/airbases/nevada.json" ),
            require( "../../public/databases/airbases/normandy.json" ),
            require( "../../public/databases/airbases/persiangulf.json" ),
            require( "../../public/databases/airbases/sinaimap.json" ),
            require( "../../public/databases/airbases/syria.json" ),
            require( "../../public/databases/airbases/thechannel.json" )
        ].forEach( data => {
            const validate = ajv.compile(this.getSchema());
            const valid = validate(data);
            
            if (!valid) console.error(validate.errors);
        });
    }

}