import { firestore } from "../firebase";

export interface ATCAPIInterface {
    get: CallableFunction
}

export abstract class ATCAPI {

    firestore;
    
    constructor() {
        this.firestore = firestore;
    }

}