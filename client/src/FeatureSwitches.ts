export interface FeatureSwitchInterface {
    "defaultEnabled": boolean,  //  default on/off state (if allowed by masterSwitch)
    "label": string,
    "masterSwitch": boolean,    //  on/off regardless of user preference
    "name": string,
    "onEnabled"?: CallableFunction,
    "options"?: object,
    "removeArtifactsIfDisabled"?: boolean
}


class FeatureSwitch {

    //  From config param
    defaultEnabled;
    label;
    masterSwitch;
    name;
    onEnabled;
    removeArtifactsIfDisabled = true;

    //  Self-set
    userPreference;


    constructor( config:FeatureSwitchInterface ) {

        this.defaultEnabled = config.defaultEnabled;
        this.label          = config.label;
        this.masterSwitch   = config.masterSwitch;
        this.name           = config.name;
        this.onEnabled      = config.onEnabled;

        this.userPreference = this.getUserPreference();

    }


    getUserPreference() {

        let preferences = JSON.parse( localStorage.getItem( "featureSwitches" ) || "{}" );

        return ( preferences.hasOwnProperty( this.name ) ) ? preferences[ this.name ] : this.defaultEnabled;        

    }


    isEnabled() {

        if ( !this.masterSwitch ) {
            return false;
        }

        return this.userPreference;
    }

}

export class FeatureSwitches {

    #featureSwitches:FeatureSwitch[] = [

        new FeatureSwitch({
            "defaultEnabled": false,
            "label": "AIC",
            "masterSwitch": true,
            "name": "aic"
        }),
        
        new FeatureSwitch({
            "defaultEnabled": false,
            "label": "AI Formations",
            "masterSwitch": true,
            "name": "ai-formations",
            "removeArtifactsIfDisabled": false
        }),
        
        new FeatureSwitch({
            "defaultEnabled": false,
            "label": "ATC",
            "masterSwitch": true,
            "name": "atc"
        }),
        
        new FeatureSwitch({
            "defaultEnabled": false,
            "label": "Force show unit control panel",
            "masterSwitch": true,
            "name": "forceShowUnitControlPanel",
            "onEnabled": function() {
                document.body.classList.add( "forceShowUnitControlPanel" );
            }
        })

    ];


    constructor() {

        this.#testSwitches();

        this.savePreferences();

    }


    getSwitch( switchName:string ) {

        return this.#featureSwitches.find( featureSwitch => featureSwitch.name === switchName );

    }


    #testSwitches() {
        
        for ( const featureSwitch of this.#featureSwitches ) {

            if ( featureSwitch.isEnabled() ) {

                if ( typeof featureSwitch.onEnabled === "function" ) {

                    featureSwitch.onEnabled();

                }


            } else {
                
                document.querySelectorAll( "[data-feature-switch='" + featureSwitch.name + "']" ).forEach( el => {

                    if ( featureSwitch.removeArtifactsIfDisabled === false ) {
                        el.remove();
                    } else {
                        el.classList.add( "hide" );
                    }

                });

            }
        }

    }


    savePreferences() {

        let preferences:any = {};

        for ( const featureSwitch of this.#featureSwitches ) {
            preferences[ featureSwitch.name ] = featureSwitch.isEnabled();
        }

        localStorage.setItem( "featureSwitches", JSON.stringify( preferences ) );

    }

}