import { AICFormation } from "./AICFormation";
import { AICFormationDescriptorSection } from "./AICFormationDescriptorSection";
import { AICFormationDescriptorSection_Formation } from "./AICFormationDescriptorSection/Formation";
import { AICFormationDescriptorSection_Unit } from "./AICFormationDescriptorSection/Unit";
import { AICFormationDescriptorSection_NumGroups } from "./AICFormationDescriptorSection/NumGroups";
import { AICFormationDescriptorSection_Who } from "./AICFormationDescriptorSection/Who";


export interface AICFormationContextDataInterface {
    "aicCallsign"  : string,
    "bullseyeName" : string,
    "control"      : "broadcast" | "tactical",
    "numGroups"    : number
}


export class AICFormationDescriptor {

    #sections:AICFormationDescriptorSection[] = [
        new AICFormationDescriptorSection_Who(),
        new AICFormationDescriptorSection_NumGroups(),
        new AICFormationDescriptorSection_Formation(),
        new AICFormationDescriptorSection_Unit()
    ]

    constructor() {
    }


    addSection( section:AICFormationDescriptorSection ) {
        this.#sections.push( section );
    }


    getSections() {
        return this.#sections;
    }


    generate( formation:AICFormation, contextData: AICFormationContextDataInterface ) {

        let output:object[] = [];

        for ( const section of this.#sections ) {
            output.push(
                section.generate( formation, contextData )
            );
        }

        return output;

    }


}