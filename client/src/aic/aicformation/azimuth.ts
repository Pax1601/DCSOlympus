import { AICFormation, AICFormationInterface } from "../aicformation";
import { AICFormationContextDataInterface } from "../aicformationdescriptor";
import { AICFormationDescriptorSection } from "../aicformationdescriptorsection";
import { AICFormationDescriptorComponent } from "../aicformationdescriptorcomponent";
import { AICFormationDescriptorPhrase } from "../aicformationdescriptorphrase";

export class AICFormation_Azimuth extends AICFormation implements AICFormationInterface {

    "icon"          = "azimuth.png";
    "label"         = "Azimuth";
    "name"          = "azimuth";
    "numGroups"     = 2;
    "summary"       = "Two contacts, side-by-side in a line perpedicular to the perspective.";
    "unitBreakdown" = [ "<compass> group", "<compass> group" ];

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