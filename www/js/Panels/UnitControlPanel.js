class UnitControlPanel
{
    constructor(id)
    {
        this._panel = document.getElementById(id); 

        /* Create all buttons, disabled by default */
        //this._moveButton = new PanelButton(this._panel, "fa-play");
        //this._stopButton = new PanelButton(this._panel, "fa-pause");
        this._slowButton = new PanelButton(this._panel, "fa-angle-right", "Decelerate");
        this._fastButton = new PanelButton(this._panel, "fa-angle-double-right", "Accelerate");
        this._descendButton = new PanelButton(this._panel, "fa-arrow-down", "Descend");
        this._climbButton = new PanelButton(this._panel, "fa-arrow-up", "Climb");
        //this._repeatButton = new PanelButton(this._panel, "fa-undo");

        this.setEnabled(false);

        //this._moveButton.addCallback(unitsManager.selectedUnitsMove);
        //this._stopButton.addCallback(() => unitsManager.selectedUnitsChangeSpeed('stop'));
        this._slowButton.addCallback(() => unitsManager.selectedUnitsChangeSpeed('slow')); 
        this._fastButton.addCallback(() => unitsManager.selectedUnitsChangeSpeed('fast')); 
        this._descendButton.addCallback(() => unitsManager.selectedUnitsChangeAltitude('descend')); 
        this._climbButton.addCallback(() => unitsManager.selectedUnitsChangeAltitude('climb'));  
    }

    setEnabled(enabled)
    {
        //this._moveButton.setEnabled(true);
        //this._stopButton.setEnabled(true);
        this._slowButton.setEnabled(enabled);
        this._fastButton.setEnabled(enabled);
        this._descendButton.setEnabled(enabled);
        this._climbButton.setEnabled(enabled);
    }
}
