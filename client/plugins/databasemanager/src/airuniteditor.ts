import { LoadoutBlueprint, UnitBlueprint } from "interfaces";
import { UnitEditor } from "./uniteditor";
import { LoadoutEditor } from "./loadouteditor";

export class AirUnitEditor extends UnitEditor {
    #loadoutEditor: LoadoutEditor | null = null;

    constructor(scrollDiv: HTMLElement, contentDiv1: HTMLElement, contentDiv2: HTMLElement) {
        super(scrollDiv, contentDiv1, contentDiv2);
        this.#loadoutEditor = new LoadoutEditor(this.contentDiv2);
    }

    setContent(blueprint: UnitBlueprint) {
        this.contentDiv1.replaceChildren();
        
        this.addStringInput("Name", blueprint.name);
        this.addStringInput("Label", blueprint.label);
        this.addStringInput("Short label", blueprint.shortLabel);
        this.addDropdownInput("Coalition", blueprint.coalition, ["", "blue", "red"]);
        this.addDropdownInput("Era", blueprint.era, ["WW2", "Early Cold War", "Mid Cold War", "Late Cold War", "Modern"]);
        this.addStringInput("Filename", blueprint.filename?? "");
        this.addStringInput("Cost", String(blueprint.cost)?? "", "number");

        this.addLoadoutList(blueprint.loadouts?? []);
    }

    addLoadoutList(loadouts: LoadoutBlueprint[]) {
        var loadoutsEl = document.createElement("div");
        loadoutsEl.classList.add("dc-scroll-container", "dc-loadout-container")
        loadouts.forEach((loadout: LoadoutBlueprint) => {
            var div = document.createElement("div");
            loadoutsEl.appendChild(div);
            div.textContent = loadout.name;
            div.onclick = () => { 
                this.#loadoutEditor?.setLoadout(loadout);
                this.#loadoutEditor?.show();
            };
        });
        this.contentDiv1.appendChild(loadoutsEl);
    }
}
