import { mToFt, msToKnots } from "../other/utils";

export class Converter {

    metresToFeet(distance:number) {
        return mToFt(distance);
    }

    metresPerSecondToKnots(speed:number) {
        return msToKnots(speed);
    }

}