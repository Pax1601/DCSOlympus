import { LatLng } from "leaflet";
import { getMissionData } from "..";
import { distance, bearing, zeroPad, zeroAppend } from "../other/utils";
import { Unit } from "../units/unit";

export class MouseInfoPanel {
    #element: HTMLElement
    #display: string;

    constructor(ID: string) {
        this.#element = <HTMLElement>document.getElementById(ID);
        this.#display = '';
        if (this.#element != null) {
            this.#display = this.#element.style.display;
            var el = <HTMLElement>this.#element.querySelector(`#measure-position`);
            this.show();
        }
    }

    show() {
        this.#element.style.display = this.#display;
    }

    hide() {
        this.#element.style.display = "none";
    }

    update(mousePosition: LatLng, measurePosition: LatLng | null, unitPosition: LatLng | null) {
        var bullseyes = getMissionData().getBullseyes();
        for (let idx in bullseyes)
        {
            var dist = distance(bullseyes[idx].lat, bullseyes[idx].lng, mousePosition.lat, mousePosition.lng);
            var bear = bearing(bullseyes[idx].lat, bullseyes[idx].lng, mousePosition.lat, mousePosition.lng);
            var el = <HTMLElement>this.#element.querySelector(`#bullseye-${idx}`);
            if (el != null)
                el.innerHTML = `${zeroAppend(Math.floor(bear), 3)}° / ${zeroAppend(Math.floor(dist*0.000539957), 3)} NM`
        }

        if (measurePosition) {
            var dist = distance(measurePosition.lat, measurePosition.lng, mousePosition.lat, mousePosition.lng);
            var bear = bearing(measurePosition.lat, measurePosition.lng, mousePosition.lat, mousePosition.lng);
            var el = <HTMLElement>this.#element.querySelector(`#measure-position`);
            if (el != null)
            {
                el.innerHTML = `${zeroAppend(Math.floor(bear), 3)}° / ${zeroAppend(Math.floor(dist*0.000539957), 3)} NM`
                if (el.parentElement != null)
                    el.parentElement.style.display = 'flex';    //TODO: don't like that its hardcoded
            }
        }
        else {
            var el = <HTMLElement>this.#element.querySelector(`#measure-position`);
            if (el != null && el.parentElement != null)
                el.parentElement.style.display = 'none';
        }

        if (unitPosition) {
            var dist = distance(unitPosition.lat, unitPosition.lng, mousePosition.lat, mousePosition.lng);
            var bear = bearing(unitPosition.lat, unitPosition.lng, mousePosition.lat, mousePosition.lng);
            var el = <HTMLElement>this.#element.querySelector(`#unit-position`);
            if (el != null)
            {
                el.innerHTML = `${zeroAppend(Math.floor(bear), 3)}° / ${zeroAppend(Math.floor(dist*0.000539957), 3)} NM`
                if (el.parentElement != null)
                    el.parentElement.style.display = 'flex';    //TODO: don't like that its hardcoded
            }
        }
        else {
            var el = <HTMLElement>this.#element.querySelector(`#unit-position`);
            if (el != null && el.parentElement != null)
                el.parentElement.style.display = 'none';
        }
    }
}