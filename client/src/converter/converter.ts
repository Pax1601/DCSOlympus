import { mToFt, mToNm, msToKnots } from "../other/utils";

export class Converter {

    metresToFeet(distance:number) {
        return mToFt(distance);
    }

    metresToNauticalMiles(distance:number) {
        return mToNm(distance);
    }

    metresPerSecondToKnots(speed:number) {
        return msToKnots(speed);
    }

}