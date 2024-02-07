import Ajv from "ajv";
import { AnySchemaObject } from "ajv/dist/core";


//  For future extension
abstract class JSONSchemaValidator {

    #ajv:Ajv;
    #compiledValidator:any;
    #schema!:AnySchemaObject;

    constructor( schema:AnySchemaObject ) {
        this.#schema = schema;

        this.#ajv = new Ajv({
            "allErrors": true
        });

        this.#compiledValidator = this.getAjv().compile(this.getSchema());

    }

    getAjv() {
        return this.#ajv;
    }

    getCompiledValidator() {
        return this.#compiledValidator;
    }

    getErrors() {
        return this.getCompiledValidator().errors;
    }

    getSchema() {
        return this.#schema;
    }

    validate(data:any) {
        return (this.getCompiledValidator())(data);
    }

}


export class AirbasesJSONSchemaValidator extends JSONSchemaValidator {

    constructor() {

        const schema = require("../schemas/airbases.schema.json");

        super( schema );
        
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
            const validate = this.getAjv().compile(this.getSchema());
            const valid = validate(data);
            
            if (!valid) console.error(validate.errors);
        });
    }

}


export class ImportFileJSONSchemaValidator extends JSONSchemaValidator {

    constructor() {
        const schema = require("../schemas/importdata.schema.json");
        super( schema );
    }

}