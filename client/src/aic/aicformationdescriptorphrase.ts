import { AICFormation } from "./aicformation";
import { AICFormationContextDataInterface } from "./aicformationdescriptor";
import { AICFormationDescriptorComponent } from "./aicformationdescriptorcomponent";

export interface AICFormationDescriptorPhraseInterface {
    "generate"      : CallableFunction,
    "label"         : string,
    "name"          : string
}

export class AICFormationDescriptorPhrase {

    #components : AICFormationDescriptorComponent[] = [];
    label       = "";
    name        = "";

    constructor() {
    }


    addComponent( component:AICFormationDescriptorComponent ) {
        this.#components.push( component );
        return this;
    }



    getComponents() {
        return this.#components;
    }


    generate( formation:AICFormation, contextData: AICFormationContextDataInterface ) {

        return this;

    }


}