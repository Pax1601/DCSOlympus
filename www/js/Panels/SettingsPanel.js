class SettingsPanel
{
    constructor(id)
    {
        this._panel = document.getElementById(id); 

        /* Create all buttons, disabled by default */
        this._humanIcon = "fa-user";
        this._AIIcon = "fa-desktop";
        this._weaponsIcon = "fa-bomb";
        this._labelsIcon = "fa-font";
        this._deadIcon = "fa-skull";

        this._humanButton = new PanelButton(this._panel, this._humanIcon, "Player visibility");
        this._AIButton = new PanelButton(this._panel, this._AIIcon, "AI visibility");
        this._weaponsButton = new PanelButton(this._panel, this._weaponsIcon, "Weapons visibility");
        this._deadAliveButton = new PanelButton(this._panel, this._deadIcon, "Dead units visibility");

        this._humanButton.addCallback(() => this._onHumanButton());
        this._AIButton.addCallback(() => this._onAIButton());
        this._weaponsButton.addCallback(() => this._onWeaponsButton()); 
        this._deadAliveButton.addCallback(() => this._cycleDeadAlive()); 

        this._human = "labels";
        this._humanButton.setSubicon(this._labelsIcon);
        this._AI = "marker";
        this._weapons = "marker";
        this._deadAlive = "both";
    }

    getSettings()
    {
        return {'human': this._human, 'AI': this._AI, 'weapons': this._weapons, 'deadAlive': this._deadAlive}
    }

    _onHumanButton()
    {
        this._human = this._cycleVisibility(this._humanButton, this._human, this._humanIcon);
    }

    _onAIButton()
    {
        this._AI = this._cycleVisibility(this._AIButton, this._AI, this._AIIcon);
    }

    _onWeaponsButton()
    {
        this._weapons = this._cycleVisibility(this._weaponsButton, this._weapons, this._weaponsIcon);
    }

    _cycleVisibility(button, variable, icon)
    {
        if (variable === "labels")
        {
            variable = "marker";
            button.setIcon(icon);
            button.setSlashed(false);
        }
        else if (variable === "marker")
        {
            variable = "none";
            button.setSlashed(true);
        }
        else
        {
            variable = "labels";
            button.setSubicon(this._labelsIcon);
            button.setSlashed(false);
        }
        return variable;
    }

    _cycleDeadAlive()
    {
        if (this._deadAlive === "both")
        {
            this._deadAlive = "alive";
            this._deadAliveButton.setSlashed(true);
        }
        else
        {
            this._deadAlive = "both";
            this._deadAliveButton.setSlashed(false);
        }
    }
}
