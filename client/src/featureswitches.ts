export interface FeatureSwitchInterface {
    "defaultEnabled": boolean,  //  default on/off state (if allowed by forceState)
    "forceState": number,       //  -1 don't force; 0 force off; 1 force on
    "label": string,
    "name": string,
    "onEnabled"?: CallableFunction,
    "options"?: object,
    "removeArtifactsIfDisabled"?: boolean
}


class FeatureSwitch {

    //  From config param
    defaultEnabled;
    forceState = -1;
    label;
    name;
    onEnabled;
    removeArtifactsIfDisabled = true;

    //  Self-set
    userPreference;


    constructor( config:FeatureSwitchInterface ) {

        this.defaultEnabled = config.defaultEnabled;
        this.forceState     = config.forceState;
        this.label          = config.label;
        this.name           = config.name;
        this.onEnabled      = config.onEnabled;

        this.userPreference = this.getUserPreference();

    }


    getUserPreference() {

        let preferences = JSON.parse( localStorage.getItem( "featureSwitches" ) || "{}" );

        return ( preferences.hasOwnProperty( this.name ) ) ? preferences[ this.name ] : this.defaultEnabled;        

    }


    isEnabled() {

        if ( this.forceState === 0 ) {
            return false;
        }

        if ( this.forceState === 1 ) {
            return true;
        }

        return this.userPreference;
    }

}

export class FeatureSwitches {

    #featureSwitches:FeatureSwitch[] = [

        new FeatureSwitch({
            "defaultEnabled": false,
            "forceState": -1,
            "label": "AIC",
            "name": "aic"
        }),
        
        new FeatureSwitch({
            "defaultEnabled": false,
            "forceState": -1,
            "label": "AI Formations",
            "name": "ai-formations",
            "removeArtifactsIfDisabled": false
        }),
        
        new FeatureSwitch({
            "defaultEnabled": false,
            "forceState": 1,
            "label": "ATC",
            "name": "atc"
        }),
        
        new FeatureSwitch({
            "defaultEnabled": false,
            "forceState": -1,
            "label": "Force show unit control panel",
            "name": "forceShowUnitControlPanel"
        }),
        
        new FeatureSwitch({
            "defaultEnabled": true,
            "forceState": -1,
            "label": "Show splash screen",
            "name": "splashScreen"
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
            document.body.classList.toggle( "feature-" + featureSwitch.name, featureSwitch.isEnabled() );
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