import { getUnitsManager } from "..";
import { Unit } from "../units/unit";
import { Panel } from "./panel";

export class HotgroupPanel extends Panel {
    constructor(ID: string) {
        super(ID);
        document.addEventListener("unitDeath", () => this.refreshHotgroups());
    }

    refreshHotgroups() {
        for (let hotgroup = 1; hotgroup <= 9; hotgroup++){
            this.removeHotgroup(hotgroup);
            if (getUnitsManager().getUnitsByHotgroup(hotgroup).length > 0) 
                this.addHotgroup(hotgroup);
            
        }
    }

    addHotgroup(hotgroup: number) {
        const hotgroupHtml =    `<div class="unit-hotgroup">
                                    <div class="unit-hotgroup-id">${hotgroup}</div>
                                </div>
                                x${getUnitsManager().getUnitsByHotgroup(hotgroup).length}`
        var el = document.createElement("div");
        el.classList.add("hotgroup-selector");
        el.innerHTML = hotgroupHtml;
        el.toggleAttribute(`data-hotgroup-${hotgroup}`, true)
        this.getElement().appendChild(el);

        el.addEventListener("click", () => {
            getUnitsManager().selectUnitsByHotgroup(hotgroup);
        });

        el.addEventListener("mouseover", () => {
            getUnitsManager().getUnitsByHotgroup(hotgroup).forEach((unit: Unit) => unit.setHighlighted(true));
        });

        el.addEventListener("mouseout", () => {
            getUnitsManager().getUnitsByHotgroup(hotgroup).forEach((unit: Unit) => unit.setHighlighted(false));
        });
    }

    removeHotgroup(hotgroup: number) {
        const el = this.getElement().querySelector(`[data-hotgroup-${hotgroup}]`) as HTMLElement;
        if (el) el.remove();
    }
}