import { PanelButton } from "./PanelButton.js";

export class SettingsPanel
{
    #panel              : HTMLElement;

    #humanIcon          : string;
    #AIIcon             : string;
    #weaponsIcon        : string;
    #labelsIcon         : string;
    #deadIcon           : string;

    #humanButton        : PanelButton;
    #AIButton           : PanelButton;
    #weaponsButton      : PanelButton; 
    #deadAliveButton    : PanelButton;

    #human              : string;
    #AI                 : string;
    #weapons            : string;
    #deadAlive          : string;

    constructor(id)
    {
        this.#panel = document.getElementById(id); 

        /* Create all buttons, disabled by default */
        this.#humanIcon = "fa-user";
        this.#AIIcon = "fa-desktop";
        this.#weaponsIcon = "fa-bomb";
        this.#labelsIcon = "fa-font";
        this.#deadIcon = "fa-skull";

        this.#humanButton = new PanelButton(this.#panel, this.#humanIcon, "Player visibility");
        this.#AIButton = new PanelButton(this.#panel, this.#AIIcon, "AI visibility");
        this.#weaponsButton = new PanelButton(this.#panel, this.#weaponsIcon, "Weapons visibility");
        this.#deadAliveButton = new PanelButton(this.#panel, this.#deadIcon, "Dead units visibility");

        this.#humanButton.addCallback(() => this.#onHumanButton());
        this.#AIButton.addCallback(() => this.#onAIButton());
        this.#weaponsButton.addCallback(() => this.#onWeaponsButton()); 
        this.#deadAliveButton.addCallback(() => this.#cycleDeadAlive()); 

        this.#human = "labels";
        this.#humanButton.setSubicon(this.#labelsIcon);
        this.#AI = "marker";
        this.#weapons = "marker";
        this.#deadAlive = "both";
    }

    getSettings()
    {
        return {'human': this.#human, 'AI': this.#AI, 'weapons': this.#weapons, 'deadAlive': this.#deadAlive}
    }

    #onHumanButton()
    {
        this.#human = this.#cycleVisibility(this.#humanButton, this.#human, this.#humanIcon);
    }

    #onAIButton()
    {
        this.#AI = this.#cycleVisibility(this.#AIButton, this.#AI, this.#AIIcon);
    }

    #onWeaponsButton()
    {
        this.#weapons = this.#cycleVisibility(this.#weaponsButton, this.#weapons, this.#weaponsIcon);
    }

    #cycleVisibility(button, variable, icon)
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
            button.setSubicon(this.#labelsIcon);
            button.setSlashed(false);
        }
        return variable;
    }

    #cycleDeadAlive()
    {
        if (this.#deadAlive === "both")
        {
            this.#deadAlive = "alive";
            this.#deadAliveButton.setSlashed(true);
        }
        else
        {
            this.#deadAlive = "both";
            this.#deadAliveButton.setSlashed(false);
        }
    }
}
