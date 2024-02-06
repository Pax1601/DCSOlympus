import { DivIcon } from 'leaflet';
import { CustomMarker } from '../map/markers/custommarker';
import { SVGInjector } from '@tanem/svg-injector';
import { AirbaseChartData, AirbaseOptions } from '../interfaces';


export class Airbase extends CustomMarker {
    #name: string = "";
    #chartData: AirbaseChartData = {
        elevation: "",
        ICAO: "",
        TACAN: "",
        runways: []
    };
    #coalition: string = "";
    #hasChartDataBeenSet: boolean = false;
    #properties: string[] = [];
    #parkings: string[] = [];

    constructor(options: AirbaseOptions) {
        super(options.position, { riseOnHover: true });

        this.#name = options.name;
    }

    chartDataHasBeenSet() {
        return this.#hasChartDataBeenSet;
    }

    createIcon() {
        var icon = new DivIcon({
            className: 'leaflet-airbase-marker',
            iconSize: [40, 40],
            iconAnchor: [20, 20]
        });   // Set the marker, className must be set to avoid white square
        this.setIcon(icon);

        var el = document.createElement("div");
        el.classList.add("airbase-icon");
        el.setAttribute("data-object", "airbase");
        el.setAttribute("data-airbase-name", this.getName());
        var img = document.createElement("img");
        img.src = "/resources/theme/images/markers/airbase.svg";
        img.onload = () => SVGInjector(img);
        el.appendChild(img);
        this.getElement()?.appendChild(el);
        el.addEventListener("mouseover", (ev) => {
            document.dispatchEvent(new CustomEvent("airbaseMouseover", { detail: this }));
        });
        el.addEventListener("mouseout", (ev) => {
            document.dispatchEvent(new CustomEvent("airbaseMouseout", { detail: this }));
        });
        el.dataset.coalition = this.#coalition;
    }

    setCoalition(coalition: string) {
        this.#coalition = coalition;
        (<HTMLElement>this.getElement()?.querySelector(".airbase-icon")).dataset.coalition = this.#coalition;
    }

    getChartData() {
        return this.#chartData;
    }

    getCoalition() {
        return this.#coalition;
    }

    setName(name: string) {
        this.#name = name;
    }

    getName() {
        return this.#name;
    }

    setChartData(chartData: AirbaseChartData) {
        this.#hasChartDataBeenSet = true;
        this.#chartData = chartData;
    }

    setProperties(properties: string[]) {
        this.#properties = properties;
    }

    getProperties() {
        return this.#properties;
    }

    setParkings(parkings: string[]) {
        this.#parkings = parkings;
    }

    getParkings() {
        return this.#parkings;
    }
}