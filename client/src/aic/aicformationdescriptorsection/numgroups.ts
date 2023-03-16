import { AICFormation } from "../aicformation";
import { AICFormationContextDataInterface } from "../aicformationdescriptor";
import { AICFormationDescriptorSection } from "../aicformationdescriptorsection";
import { AICFormationDescriptorComponent } from "../aicformationdescriptorcomponent";
import { AICFormationDescriptorPhrase } from "../aicformationdescriptorphrase";

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