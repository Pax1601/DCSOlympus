import { AICFormation } from "./aicformation";
import { AICFormationContextDataInterface } from "./aicformationdescriptor";
import { AICFormationDescriptorPhrase } from "./aicformationdescriptorphrase";

export interface AICFormationDescriptorSectionInterface {
    "generate"      : CallableFunction,
    "label"         : string,
    "name"          : string,
    "omitSection"   : boolean
}

export abstract class AICFormationDescriptorSection {

    #phrases : AICFormationDescriptorPhrase[] = [];
    label       = "";
    name        = "";
    omitSection = false;

    constructor() {
    }


    addPhrase( phrase:AICFormationDescriptorPhrase ) {
        this.#phrases.push( phrase );
    }


    generate( formation:AICFormation, contextData: AICFormationContextDataInterface ) {

        return this;

    }


    getPhrases() {
        return this.#phrases;
    }


}