import { AICFormation } from "../aicformation";
import { AICFormationContextDataInterface } from "../aicformationdescriptor";
import { AICFormationDescriptorSection } from "../aicformationdescriptorsection";
import { AICFormationDescriptorComponent } from "../aicformationdescriptorcomponent";
import { AICFormationDescriptorPhrase } from "../aicformationdescriptorphrase";

export class AICFormationDescriptorSection_Who extends AICFormationDescriptorSection {

    label = "Who";
    name  = "who";

    constructor() {
        
        super();

    }


    generate( formation:AICFormation, contextData: AICFormationContextDataInterface ) {

        let phrase = new AICFormationDescriptorPhrase();

        if ( contextData.control === "tactical" ) {
            phrase.addComponent( new AICFormationDescriptorComponent( "<their callsign>", "Their callsign" ) );
        }

        phrase.addComponent( new AICFormationDescriptorComponent( contextData.aicCallsign, "Your callsign" ) );

        this.addPhrase( phrase );

        return this;

    }

}