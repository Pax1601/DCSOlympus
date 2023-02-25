import { AICFormation, AICFormationInterface } from "../AICFormation";
import { AICFormationContextDataInterface, AICFormationDescriptor } from "../AICFormationDescriptor";

export class AICFormation_Single extends AICFormation implements AICFormationInterface {

    "icon"          = "single.png";
    "label"         = "Single";
    "name"          = "single";
    "numGroups"     = 1;
    "summary"       = "One contact on its own";
    "unitBreakdown" = [];

    constructor() {

        super();
        
    }


    showFormationNameInDescriptor() {
        return false;
    }

}