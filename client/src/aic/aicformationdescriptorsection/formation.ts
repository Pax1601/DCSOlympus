import { AICFormation } from "../aicformation";
import { AICFormationContextDataInterface } from "../aicformationdescriptor";
import { AICFormationDescriptorSection } from "../aicformationdescriptorsection";
import { AICFormationDescriptorComponent } from "../aicformationdescriptorcomponent";
import { AICFormationDescriptorPhrase } from "../aicformationdescriptorphrase";

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