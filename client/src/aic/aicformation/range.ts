import { AICFormation, AICFormationInterface } from "../aicformation";
import { AICFormationContextDataInterface } from "../aicformationdescriptor";
import { AICFormationDescriptorSection } from "../aicformationdescriptorsection";
import { AICFormationDescriptorComponent } from "../aicformationdescriptorcomponent";
import { AICFormationDescriptorPhrase } from "../aicformationdescriptorphrase";

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