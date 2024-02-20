import Ajv from "ajv";
import { AnySchemaObject } from "ajv/dist/core";


//  For future extension
abstract class JSONSchemaValidator {

    #ajv: Ajv;
    #compiledValidator: any;
    #schema!: AnySchemaObject;

    constructor(schema: AnySchemaObject) {
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

    validate(data: any) {
        return (this.getCompiledValidator())(data);
    }

}

export class ImportFileJSONSchemaValidator extends JSONSchemaValidator {
    constructor() {
        const schema = require("../schemas/importdata.schema.json");
        super(schema);
    }
}