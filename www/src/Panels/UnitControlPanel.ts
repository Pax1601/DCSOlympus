import { PanelButton } from "./PanelButton.js";

export class UnitControlPanel
{
    #panel          : HTMLElement;
    #slowButton     : PanelButton;
    #fastButton     : PanelButton;
    #descendButton  : PanelButton;
    #climbButton    : PanelButton;

    constructor(id)
    {
        this.#panel = document.getElementById(id); 

        /* Create all buttons, disabled by default */
        //this.#moveButton = new PanelButton(this.#panel, "fa-play");
        //this.#stopButton = new PanelButton(this.#panel, "fa-pause");
        this.#slowButton = new PanelButton(this.#panel, "fa-angle-right", "Decelerate");
        this.#fastButton = new PanelButton(this.#panel, "fa-angle-double-right", "Accelerate");
        this.#descendButton = new PanelButton(this.#panel, "fa-arrow-down", "Descend");
        this.#climbButton = new PanelButton(this.#panel, "fa-arrow-up", "Climb");
        //this.#repeatButton = new PanelButton(this.#panel, "fa-undo");

        this.setEnabled(false);

        //this.#moveButton.addCallback(unitsManager.selectedUnitsMove);
        //this.#stopButton.addCallback(() => unitsManager.selectedUnitsChangeSpeed('stop'));
        this.#slowButton.addCallback(() => unitsManager.selectedUnitsChangeSpeed('slow')); 
        this.#fastButton.addCallback(() => unitsManager.selectedUnitsChangeSpeed('fast')); 
        this.#descendButton.addCallback(() => unitsManager.selectedUnitsChangeAltitude('descend')); 
        this.#climbButton.addCallback(() => unitsManager.selectedUnitsChangeAltitude('climb'));  
    }

    setEnabled(enabled)
    {
        //this.#moveButton.setEnabled(true);
        //this.#stopButton.setEnabled(true);
        this.#slowButton.setEnabled(enabled);
        this.#fastButton.setEnabled(enabled);
        this.#descendButton.setEnabled(enabled);
        this.#climbButton.setEnabled(enabled);
    }
}
