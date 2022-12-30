class UnitControlPanel
{
    constructor(id)
    {
        this._panel = document.getElementById(id); 

        /* Create all buttons, disabled by default */
        this._moveButton = new PanelButton(this._panel, "fa-play");
        this._stopButton = new PanelButton(this._panel, "fa-pause");
        this._slowButton = new PanelButton(this._panel, "fa-angle-right");
        this._fastButton = new PanelButton(this._panel, "fa-angle-double-right");
        this._descendButton = new PanelButton(this._panel, "fa-arrow-down");
        this._climbButton = new PanelButton(this._panel, "fa-arrow-up");
        this._repeatButton = new PanelButton(this._panel, "fa-undo");

        this._moveButton.addCallback(unitsManager.selectedUnitsMove);
        this._stopButton.addCallback(() => unitsManager.selectedUnitsChangeSpeed('stop'));
        this._slowButton.addCallback(() => unitsManager.selectedUnitsChangeSpeed('slow')); 
        this._fastButton.addCallback(() => unitsManager.selectedUnitsChangeSpeed('fast')); 
        this._descendButton.addCallback(() => unitsManager.selectedUnitsChangeAltitude('descend')); 
        this._climbButton.addCallback(() => unitsManager.selectedUnitsChangeAltitude('climb'));  
    }

    enableButtons(enableAltitudeButtons)
    {
        this._moveButton.setEnabled(true);
        this._stopButton.setEnabled(true);
        this._slowButton.setEnabled(true);
        this._fastButton.setEnabled(true);
        if (enableAltitudeButtons)
        {
            this._descendButton.setEnabled(true);
            this._climbButton.setEnabled(true);
        }
        
    }

    disableButtons()
    {
        this._moveButton.setEnabled(false);
        this._stopButton.setEnabled(false);
        this._slowButton.setEnabled(false);
        this._fastButton.setEnabled(false);
        this._descendButton.setEnabled(false);
        this._climbButton.setEnabled(false);
    }
}
