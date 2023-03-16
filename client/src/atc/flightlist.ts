import { ATCMockAPI_Flights } from "./atcmockapi/flights";

export class ATCFLightList {


    constructor() {



    }


    getFlights( generateMockDataIfEmpty?:boolean ) {
        let api = new ATCMockAPI_Flights();
        return api.get( generateMockDataIfEmpty );
    }

}