import { AICFormationContextDataInterface, AICFormationDescriptor } from "./aicformationdescriptor";
import { AICFormationDescriptorPhrase } from "./aicformationdescriptorphrase";
import { AICFormationDescriptorSection } from "./aicformationdescriptorsection";

export interface AICFormationInterface {
    "icon"          : string,
    "label"         : string,
    "name"          : string,
    "numGroups"     : number,
    "summary"       : string,
    "unitBreakdown" : string[]
}



export abstract class AICFormation {

    "icon"          = "";
    "label"         = "";
    "name"          = "";
    "numGroups"     = 1;
    "summary"       = "";
    "unitBreakdown":string[] = []


    constructor() {

        this.unitBreakdown = [];
    }


    addToDescriptorPhrase( section: AICFormationDescriptorSection, phrase: AICFormationDescriptorPhrase, contextData: AICFormationContextDataInterface ) {
        return phrase;
    }


    getDescriptor( contextData: AICFormationContextDataInterface ) {

        return new AICFormationDescriptor().generate( this, contextData );

    }


    hasUnitBreakdown() {
        return this.unitBreakdown.length > 0;
    }


    showFormationNameInDescriptor() {
        return true;
    }


}