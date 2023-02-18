import { ATCAPI, ATCAPIInterface } from "../ATCAPI";
import { collection, getDocs } from "firebase/firestore";
import { firebase } from "../../firebase";

export class ATCAPI_Flights extends ATCAPI implements ATCAPIInterface {

    constructor() {
        super();
    }

    get() {

        async () => {
            const snapshot = await getDocs( collection( this.firestore, "flights" ) );

            snapshot.forEach( doc => {
                console.log( doc.data() );
            });
            
        }

    }

}