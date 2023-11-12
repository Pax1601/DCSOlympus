import { getApp } from "..";
import { GROUND_UNIT_AIR_DEFENCE_REGEX } from "../constants/constants";
import { Dialog } from "../dialog/dialog";
import { zeroAppend } from "../other/utils";
import { Unit } from "./unit";
import { UnitDataFile } from "./unitdatafile";

export class UnitDataFileImport extends UnitDataFile {

    #data!:any;
    #dialog:Dialog;
    #element!:HTMLElement;
    #categoryCoalitionHeaders!: HTMLElement;
    #categoryCoalitionMatrix!: HTMLElement;

    constructor( elementId:string ) {
        super();
        this.#dialog = new Dialog(elementId);
        this.#element = this.#dialog.getElement();
        this.#categoryCoalitionMatrix  = <HTMLElement>this.#element.querySelector("tbody");
        this.#categoryCoalitionHeaders = <HTMLElement>this.#element.querySelector("thead");

        // this.#element.querySelector(".start-transfer.import")?.addEventListener("click", (ev:MouseEventInit) => {
        //     this.#doImport();
        // });
    }

    #doImport() {
        
                /*
                for (let groupName in groups) {
                    if (groupName !== "" && groups[groupName].length > 0 && (groups[groupName].every((unit: UnitData) => { return unit.category == "GroundUnit"; }) || groups[groupName].every((unit: any) => { return unit.category == "NavyUnit"; }))) {
                        var aliveUnits = groups[groupName].filter((unit: UnitData) => { return unit.alive });
                        var units = aliveUnits.map((unit: UnitData) => {
                            return { unitType: unit.name, location: unit.position, liveryID: "" }
                        });
                        getApp().getUnitsManager().spawnUnits(groups[groupName][0].category, units, groups[groupName][0].coalition, true);
                    }
                }
                //*/
    }

    selectFile() {
        var input = document.createElement("input");
        input.type = "file";
        input.addEventListener("change", (e: any) => {
            var file = e.target.files[0];
            if (!file) {
                return;
            }
            var reader = new FileReader();
            reader.onload = function (e: any) {
                var contents = e.target.result;
                var groups = JSON.parse(contents);
                console.log(groups);
            };
            reader.readAsText(file);
        })
        input.click();
    }

}