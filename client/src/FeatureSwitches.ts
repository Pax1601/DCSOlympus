export interface FeatureSwitchInterface {
    "enabled": boolean,
    "label": string,
    "name": string,
    "options"?: object,
    "removeArtifactsIfDisabled"?: boolean
}


class FeatureSwitch {
    enabled;
    label;
    name;
    removeArtifactsIfDisabled = true;

    constructor( config:FeatureSwitchInterface ) {

        this.enabled = config.enabled;
        this.label   = config.label;
        this.name    = config.name;

    }


    isEnabled() {
        return this.enabled;
    }

}

export class FeatureSwitches {

    #featureSwitches:FeatureSwitch[] = [

        new FeatureSwitch({
            "enabled": false,
            "label": "AIC",
            "name": "aic"
        }),
        
        new FeatureSwitch({
            "enabled": false,
            "label": "ATC",
            "name": "atc",
            "options": {
                "key": "value"
            }
        })

    ];


    constructor() {

        this.#removeArtifacts();

    }


    getSwitch( switchName:string ) {

        return this.#featureSwitches.find( featureSwitch => featureSwitch.name === switchName );

    }


    #removeArtifacts() {
        
        for ( const featureSwitch of this.#featureSwitches ) {
            if ( !featureSwitch.isEnabled() && featureSwitch.removeArtifactsIfDisabled !== false ) {
                document.querySelectorAll( "[data-feature-switch='" + featureSwitch.name + "']" ).forEach( el => el.remove() );
            }
        }

    }

}