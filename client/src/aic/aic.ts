import { ToggleableFeature } from "../toggleablefeature";
import { AICFormation_Azimuth } from "./aicformation/azimuth";
import { AICFormation_Range } from "./aicformation/range";
import { AICFormation_Single } from "./aicformation/single";
import { AICFormationDescriptorSection } from "./aicformationdescriptorsection";


export class AIC extends ToggleableFeature {

    #formations = [

        new AICFormation_Single(),
        new AICFormation_Range(),
        new AICFormation_Azimuth()

    ];


    constructor() {

        super( false );
        
        this.onStatusUpdate();

        //  This feels kind of dirty
        let $aicFormationList = document.getElementById( "aic-formation-list" );

        if ( $aicFormationList ) {

            this.getFormations().forEach( formation => {

                //  Image
                let $imageDiv = document.createElement( "div" );
                $imageDiv.classList.add( "aic-formation-image" );

                let $img = document.createElement( "img" );
                $img.src = "images/formations/" + formation.icon;

                $imageDiv.appendChild( $img );
                
                //  Name
                let $nameDiv = document.createElement( "div" );
                $nameDiv.classList.add( "aic-formation-name" );
                $nameDiv.innerText = formation.label;
                
                // Wrapper
                let $wrapperDiv = document.createElement( "div" );
                $wrapperDiv.dataset.formationName = formation.name;
                $wrapperDiv.appendChild( $imageDiv )
                $wrapperDiv.appendChild( $nameDiv );
                $wrapperDiv.addEventListener( "click", ( ev ) => {

                    const controlTypeInput = document.querySelector( "input[type='radio'][name='control-type']:checked" );

                    let controlTypeValue:any = ( controlTypeInput instanceof HTMLInputElement && [ "broadcast", "tactical" ].indexOf( controlTypeInput.value ) > -1 ) ? controlTypeInput.value : "broadcast";

                    //  TODO: make this not an "any"
                    const output:any = formation.getDescriptor({
                        "aicCallsign"  : "Magic",
                        "bullseyeName" : "Bullseye",
                        "control"      : controlTypeValue,
                        "numGroups"    : formation.numGroups
                    });

                    this.updateTeleprompt( output );

                });

                //  Add to DOM
                $aicFormationList?.appendChild( $wrapperDiv );

            });

        }

    }


    getFormations() {
        return this.#formations;
    }


    onStatusUpdate() {

        //  Update the DOM
        document.body.classList.toggle( "aic-enabled", this.getStatus() );

    }


    toggleHelp() {
        document.getElementById( "aic-help" )?.classList.toggle( "hide" );
    }

//*
    updateTeleprompt<T extends AICFormationDescriptorSection>( descriptor:T[] ) {

        let $teleprompt = document.getElementById( "aic-teleprompt" );

        if ( $teleprompt instanceof HTMLElement ) {

            //  Clean slate
            while ( $teleprompt.childNodes.length > 0 ) {
                $teleprompt.childNodes[0].remove();
            }

            function newDiv() {
                return document.createElement( "div" );
            }

            //  Wrapper
            let $descriptor = newDiv();
            $descriptor.id = "aic-descriptor";

            for ( const section of descriptor ) {

                if ( section.omitSection ) {
                    continue;
                }

                let $section = newDiv();
                $section.classList.add( "aic-descriptor-section" );

                let $sectionLabel = newDiv();
                $sectionLabel.classList.add( "aic-descriptor-section-label" );
                $sectionLabel.innerText = section.label;
                $section.appendChild( $sectionLabel );


                for ( const phrase of section.getPhrases() ) {

                    let $phrase = newDiv();
                    $phrase.classList.add( "aic-descriptor-phrase" );

                    for ( const component of phrase.getComponents() ) {

                        let $component = newDiv();
                        $component.classList.add( "aic-descriptor-component" );
    
                        let $componentLabel = newDiv();
                        $componentLabel.classList.add( "aic-descriptor-component-label" );
                        $componentLabel.innerText = component.label;
    
                        let $componentValue = newDiv();
                        $componentValue.classList.add( "aic-descriptor-component-value" );
                        $componentValue.innerText = component.value;
    
                        $component.appendChild( $componentLabel );
                        $component.appendChild( $componentValue );

                        $phrase.appendChild( $component );
                        
                    }

                    $section.appendChild( $phrase );

                }

                $descriptor.appendChild( $section );

            }

            $teleprompt.appendChild( $descriptor );

        }


    }
//*/

}