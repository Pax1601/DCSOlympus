import { AICFormation } from "../AICFormation";
import { AICFormationContextDataInterface } from "../AICFormationDescriptor";
import { AICFormationDescriptorSection } from "../AICFormationDescriptorSection";
import { AICFormationDescriptorComponent } from "../AICFormationDescriptorComponent";
import { AICFormationDescriptorPhrase } from "../AICFormationDescriptorPhrase";

export class AICFormationDescriptorSection_NumGroups extends AICFormationDescriptorSection {

    label = "Groups";
    name  = "numgroups";

    constructor() {
        
        super();

    }


    generate( formation:AICFormation, contextData: AICFormationContextDataInterface ) {

        let value = "Single group";

        if ( contextData.numGroups > 1 ) {
            value = contextData.numGroups + " groups";
        }

        let phrase = new AICFormationDescriptorPhrase();
        phrase.addComponent( new AICFormationDescriptorComponent( value, "Number of groups" ) );
        this.addPhrase( phrase );

        return this;

    }

}