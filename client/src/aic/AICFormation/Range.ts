import { AICFormation, AICFormationInterface } from "../AICFormation";
import { AICFormationContextDataInterface } from "../AICFormationDescriptor";
import { AICFormationDescriptorSection } from "../AICFormationDescriptorSection";
import { AICFormationDescriptorComponent } from "../AICFormationDescriptorComponent";
import { AICFormationDescriptorPhrase } from "../AICFormationDescriptorPhrase";

export class AICFormation_Range extends AICFormation implements AICFormationInterface {

    "icon"          = "range.png";
    "label"         = "Range";
    "name"          = "range";
    "numGroups"     = 2;
    "summary"       = "Two contacts, one behind the other";
    "unitBreakdown" = [ "Lead group", "Trail group" ];

    constructor() {

        super();
        
    }

    addToDescriptorPhrase( section: AICFormationDescriptorSection, phrase: AICFormationDescriptorPhrase, contextData: AICFormationContextDataInterface ) {

        switch ( section.name ) {

            case "formation":

                phrase.addComponent( new AICFormationDescriptorComponent( "<distance>" ) );
                phrase.addComponent( new AICFormationDescriptorComponent( "track <compass>" ) );


        }

        return phrase;

    }

}