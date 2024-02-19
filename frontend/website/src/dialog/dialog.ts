import { Panel } from "../panels/panel";

export class Dialog extends Panel {

    constructor( element:string ) {
        super( element );
    }

    hide() {
        super.hide();
        document.getElementById( "gray-out" )?.classList.toggle("hide", true);
    }

    show() {
        super.show();
        document.getElementById( "gray-out" )?.classList.toggle("hide", false);
    }

}