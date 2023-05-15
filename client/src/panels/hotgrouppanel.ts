import { getUnitsManager } from "..";
import { Panel } from "./panel";

export class HotgroupPanel extends Panel {
    addHotgroup(hotgroup: number) {
        this.removeHotgroup(hotgroup);
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
    }

    removeHotgroup(hotgroup: number) {
        const el = this.getElement().querySelector(`[data-hotgroup-${hotgroup}]`) as HTMLElement;
        if (el) el.remove();
    }
}