import { AICFormation } from "../AICFormation";
import { AICFormationContextDataInterface } from "../AICFormationDescriptor";
import { AICFormationDescriptorSection } from "../AICFormationDescriptorSection";
import { AICFormationDescriptorComponent } from "../AICFormationDescriptorComponent";
import { AICFormationDescriptorPhrase } from "../AICFormationDescriptorPhrase";

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