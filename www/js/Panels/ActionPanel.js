class ActionPanel
{
    constructor(id)
    {
        this._panel = document.getElementById(id); 

        this._attackButton = new PanelButton(this._panel, "img/buttons/attack.png", "Attack unit");
        this._bombButton = new PanelButton(this._panel, "img/buttons/bomb.png", "Precision bombing");
        this._carpetButton = new PanelButton(this._panel, "img/buttons/carpet.png", "Carpet bombing");
        this._landButton = new PanelButton(this._panel, "img/buttons/land.png", "Land here");
        this._formationButton = new PanelButton(this._panel, "img/buttons/formation.png", "Create formation");

        this._attackButton.addCallback(() => map.setState("ATTACK"));
        this._bombButton.addCallback(() => map.setState("BOMB"));
        this._carpetButton.addCallback(() => map.setState("CARPET_BOMB"));
        this._landButton.addCallback(() => map.setState("LAND"));
        this._formationButton.addCallback(() => map.setState("FORMATION"));

        this.setEnabled(false);
    }

    setEnabled(enabled)
    {
        this._attackButton.setEnabled(enabled);
        this._bombButton.setEnabled(false);
        this._carpetButton.setEnabled(false);
        this._landButton.setEnabled(false);
        this._formationButton.setEnabled(enabled);
    }
}
