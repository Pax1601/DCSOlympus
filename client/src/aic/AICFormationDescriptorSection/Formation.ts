import { AICFormation } from "../AICFormation";
import { AICFormationContextDataInterface } from "../AICFormationDescriptor";
import { AICFormationDescriptorSection } from "../AICFormationDescriptorSection";
import { AICFormationDescriptorComponent } from "../AICFormationDescriptorComponent";
import { AICFormationDescriptorPhrase } from "../AICFormationDescriptorPhrase";

export class AICFormationDescriptorSection_Formation extends AICFormationDescriptorSection {

    label = "Formation";
    name  = "formation";

    constructor() {
        
        super();

    }


    generate( formation:AICFormation, contextData: AICFormationContextDataInterface ) {

        if ( !formation.showFormationNameInDescriptor() ) {
            this.omitSection = true;
            return this;
        }

        let phrase = new AICFormationDescriptorPhrase();

        phrase.addComponent( new AICFormationDescriptorComponent( formation.label, "Formation" ) );

        phrase = formation.addToDescriptorPhrase( this, phrase, contextData );

        this.addPhrase( phrase );


        return this;

    }

}