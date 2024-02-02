import { getApp } from "..";
import { Unit } from "../unit/unit";
import { Panel } from "./panel";

export class HotgroupPanel extends Panel {

    protected showByDefault: boolean = true;

    /**
     * 
     * @param ID - the ID of the HTML element which will contain the context menu
     */
    constructor(ID: string) {
        super(ID);
        document.addEventListener("unitDeath", () => this.refreshHotgroups());
    }

    refreshHotgroups() {
        for (let hotgroup = 1; hotgroup <= 9; hotgroup++) {
            this.removeHotgroup(hotgroup);
            if (getApp().getUnitsManager().getUnitsByHotgroup(hotgroup).length > 0)
                this.addHotgroup(hotgroup);

        }
    }

    addHotgroup(hotgroup: number) {
        // Hotgroup number
        var hotgroupDiv = document.createElement("div");
        hotgroupDiv.classList.add("unit-hotgroup");
        var idDiv = document.createElement("div");
        idDiv.classList.add("unit-hotgroup-id");
        idDiv.innerText = String(hotgroup);
        hotgroupDiv.appendChild(idDiv);

        // Hotgroup unit count
        var countDiv = document.createElement("div");
        countDiv.innerText = `x${getApp().getUnitsManager().getUnitsByHotgroup(hotgroup).length}`;

        var el = document.createElement("div");
        el.appendChild(hotgroupDiv);
        el.appendChild(countDiv);
        el.classList.add("hotgroup-selector");
        el.toggleAttribute(`data-hotgroup-${hotgroup}`, true)

        this.getElement().appendChild(el);

        el.addEventListener("click", (ev: MouseEvent) => {
            getApp().getUnitsManager().selectUnitsByHotgroup(hotgroup, (!ev.ctrlKey));
        });

        el.addEventListener("mouseover", () => {
            getApp().getUnitsManager().getUnitsByHotgroup(hotgroup).forEach((unit: Unit) => unit.setHighlighted(true));
        });

        el.addEventListener("mouseout", () => {
            getApp().getUnitsManager().getUnitsByHotgroup(hotgroup).forEach((unit: Unit) => unit.setHighlighted(false));
        });
    }

    removeHotgroup(hotgroup: number) {
        const el = this.getElement().querySelector(`[data-hotgroup-${hotgroup}]`) as HTMLElement;
        if (el) el.remove();
    }

}