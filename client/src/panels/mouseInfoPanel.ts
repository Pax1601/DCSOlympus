import { LatLng } from "leaflet";
import { getMissionData } from "..";
import { distance, bearing, zeroPad, zeroAppend } from "../other/utils";
import { Panel } from "./panel";

export class MouseInfoPanel extends Panel {
    constructor(ID: string) {
        super(ID);
    }

    update(mousePosition: LatLng, measurePosition: LatLng | null, unitPosition: LatLng | null) {
        var bullseyes = getMissionData().getBullseyes();
        for (let idx in bullseyes)
        {
            var dist = distance(bullseyes[idx].lat, bullseyes[idx].lng, mousePosition.lat, mousePosition.lng);
            var bear = bearing(bullseyes[idx].lat, bullseyes[idx].lng, mousePosition.lat, mousePosition.lng);
            var el = <HTMLElement>this.getElement().querySelector(`#bullseye-${idx}`);
            if (el != null)
                el.innerHTML = `${zeroAppend(Math.floor(bear), 3)}° / ${zeroAppend(Math.floor(dist*0.000539957), 3)} NM`
        }

        if (measurePosition) {
            var dist = distance(measurePosition.lat, measurePosition.lng, mousePosition.lat, mousePosition.lng);
            var bear = bearing(measurePosition.lat, measurePosition.lng, mousePosition.lat, mousePosition.lng);
            var el = <HTMLElement>this.getElement().querySelector(`#measure-position`);
            if (el != null)
            {
                el.innerHTML = `${zeroAppend(Math.floor(bear), 3)}° / ${zeroAppend(Math.floor(dist*0.000539957), 3)} NM`
                if (el.parentElement != null)
                    el.parentElement.style.display = 'flex';    //TODO: don't like that it's hardcoded
            }
        }
        else {
            var el = <HTMLElement>this.getElement().querySelector(`#measure-position`);
            if (el != null && el.parentElement != null)
                el.parentElement.style.display = 'none';
        }

        if (unitPosition) {
            var dist = distance(unitPosition.lat, unitPosition.lng, mousePosition.lat, mousePosition.lng);
            var bear = bearing(unitPosition.lat, unitPosition.lng, mousePosition.lat, mousePosition.lng);
            var el = <HTMLElement>this.getElement().querySelector(`#unit-position`);
            if (el != null)
            {
                el.innerHTML = `${zeroAppend(Math.floor(bear), 3)}° / ${zeroAppend(Math.floor(dist*0.000539957), 3)} NM`
                if (el.parentElement != null)
                    el.parentElement.style.display = 'flex';    //TODO: don't like that its hardcoded
            }
        }
        else {
            var el = <HTMLElement>this.getElement().querySelector(`#unit-position`);
            if (el != null && el.parentElement != null)
                el.parentElement.style.display = 'none';
        }
    }
}