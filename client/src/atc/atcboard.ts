export abstract class ATCBoard {

    #boardElement:HTMLElement;

    constructor( boardElement:HTMLElement ) {

        this.#boardElement = boardElement;

    }

    getBoardElement() {
        return this.#boardElement;
    }
    
}