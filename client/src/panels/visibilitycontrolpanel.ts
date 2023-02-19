import { AirUnit, GroundUnit, NavyUnit, Weapon } from "../units/unit";

export class VisibilityControlPanel {
    #element: HTMLElement

    constructor(ID: string) {
        this.#element = <HTMLElement>document.getElementById(ID);

        if (this.#element != null)
        {
            var airVisibilityCheckbox = this.#element.querySelector("#air-visibility");
            var groundVisibilityCheckbox = this.#element.querySelector("#ground-visibility");
            var navyVisibilityCheckbox = this.#element.querySelector("#navy-visibility");
            var weaponVisibilityCheckbox = this.#element.querySelector("#weapon-visibility");

            airVisibilityCheckbox?.addEventListener("change", () => this.#onChange());
            groundVisibilityCheckbox?.addEventListener("change", () => this.#onChange());
            navyVisibilityCheckbox?.addEventListener("change", () => this.#onChange());
            weaponVisibilityCheckbox?.addEventListener("change", () => this.#onChange());

            var fullVisibilitySelection = this.#element.querySelector("#full-visibility");
            var partialVisibilitySelection = this.#element.querySelector("#partial-visibility");
            var minimalVisibilitySelection = this.#element.querySelector("#minimal-visibility");

            fullVisibilitySelection?.addEventListener("change", () => this.#onChange());
            partialVisibilitySelection?.addEventListener("change", () => this.#onChange());
            minimalVisibilitySelection?.addEventListener("change", () => this.#onChange());

            var uncontrolledVisibilityCheckbox = this.#element.querySelector("#uncontrolled-visibility");
            uncontrolledVisibilityCheckbox?.addEventListener("change", () => this.#onChange());
        }
    }

    #onChange(){
        if (this.#element != null)
        {
            var fullVisibilitySelection = <HTMLInputElement> this.#element.querySelector("#full-visibility");
            var partialVisibilitySelection = <HTMLInputElement> this.#element.querySelector("#partial-visibility");
            var minimalVisibilitySelection = <HTMLInputElement> this.#element.querySelector("#minimal-visibility");

            var activeVisibility = "";
            if (fullVisibilitySelection.checked)
                activeVisibility = "full";
            else if (partialVisibilitySelection.checked)
                activeVisibility = "partial";
            else if (minimalVisibilitySelection.checked)
                activeVisibility = "minimal";

            var uncontrolledVisibilityCheckbox = <HTMLInputElement> this.#element.querySelector("#uncontrolled-visibility");
            var uncontrolledVisibility = !uncontrolledVisibilityCheckbox.checked;
            
            var airVisibilityCheckbox = <HTMLInputElement> this.#element.querySelector("#air-visibility");
            if (airVisibilityCheckbox.checked)
                AirUnit.setVisibility({human: "full", ai: activeVisibility, uncontrolled: uncontrolledVisibility? activeVisibility: "hidden", dead: "hidden"});
            else
                AirUnit.setVisibility({human: "hidden", ai: "hidden", uncontrolled: "hidden", dead: "hidden"});

            var groundVisibilityCheckbox = <HTMLInputElement> this.#element.querySelector("#ground-visibility");
            if (groundVisibilityCheckbox.checked)
                GroundUnit.setVisibility({human: activeVisibility, ai: activeVisibility, uncontrolled: uncontrolledVisibility? activeVisibility: "hidden", dead: "hidden"});
            else
                GroundUnit.setVisibility({human: "hidden", ai: "hidden", uncontrolled: "hidden", dead: "hidden"});

            var navyVisibilityCheckbox = <HTMLInputElement> this.#element.querySelector("#navy-visibility");
            if (navyVisibilityCheckbox.checked)
                NavyUnit.setVisibility({human: activeVisibility, ai: activeVisibility, uncontrolled: uncontrolledVisibility? activeVisibility: "hidden", dead: "hidden"});
            else
                NavyUnit.setVisibility({human: "hidden", ai: "hidden", uncontrolled: "hidden", dead: "hidden"});

            var weaponVisibilityCheckbox = <HTMLInputElement> this.#element.querySelector("#weapon-visibility");
            if (weaponVisibilityCheckbox.checked)
                Weapon.setVisibility({human: activeVisibility, ai: activeVisibility, uncontrolled: uncontrolledVisibility? activeVisibility: "hidden", dead: "hidden"});
            else
                Weapon.setVisibility({human: "hidden", ai: "hidden", uncontrolled: "hidden", dead: "hidden"});
        }
        
    }

    
}