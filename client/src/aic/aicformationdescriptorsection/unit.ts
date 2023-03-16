import { AICFormation } from "../aicformation";
import { AICFormationContextDataInterface } from "../aicformationdescriptor";
import { AICFormationDescriptorSection } from "../aicformationdescriptorsection";
import { AICFormationDescriptorComponent } from "../aicformationdescriptorcomponent";
import { AICFormationDescriptorPhrase } from "../aicformationdescriptorphrase";

interface addUnitInformationInterface {
    omitTrack?: boolean
}

export class AICFormationDescriptorSection_Unit extends AICFormationDescriptorSection {

    label = "Unit";
    name  = "unit";

    constructor() {
        
        super();

    }


    addUnitInformation( formation:AICFormation, contextData: AICFormationContextDataInterface, phrase: AICFormationDescriptorPhrase, options?:addUnitInformationInterface ) {

        options = options || {};

        const originPoint = ( contextData.control === "broadcast" ) ? contextData.bullseyeName : "BRAA";

        phrase.addComponent( new AICFormationDescriptorComponent( originPoint, "Bearing origin point" ) );
        phrase.addComponent( new AICFormationDescriptorComponent( "<bearing>", "Bearing" ) );
        phrase.addComponent( new AICFormationDescriptorComponent( "<range>", "Range" ) );
        phrase.addComponent( new AICFormationDescriptorComponent( "<altitude>", "Altitude" ) );

        if ( contextData.control === "broadcast" ) {
            if ( !options.hasOwnProperty( "omitTrack" ) || options.omitTrack !== true ) {
                phrase.addComponent( new AICFormationDescriptorComponent( "track <compass>", "Tracking" ) );
            }
        } else {
            phrase.addComponent( new AICFormationDescriptorComponent( "[hot|flanking [left|right]|beam <compass>|cold]", "Azimuth" ) );
        }

        return phrase;

    }


    generate( formation:AICFormation, contextData: AICFormationContextDataInterface ) {

        if ( formation.hasUnitBreakdown() ) {

            for ( const [ i, unitRef ] of formation.unitBreakdown.entries() ) {

                let phrase = new AICFormationDescriptorPhrase();

                phrase.addComponent( new AICFormationDescriptorComponent( unitRef, "Unit reference" ) );

                if ( i === 0 ) {
                    this.addUnitInformation( formation, contextData, phrase, { "omitTrack": true } );
                } else {
                    phrase.addComponent( new AICFormationDescriptorComponent( "<altitude>" ) );
                }

                phrase.addComponent( new AICFormationDescriptorComponent( "hostile" ) );

                this.addPhrase( phrase );
                

            }

        } else {

            this.addPhrase(
                this.addUnitInformation( formation, contextData, new AICFormationDescriptorPhrase() )
            );

        }

        return this;

    }


}