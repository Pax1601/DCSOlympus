import { DivIcon } from "leaflet";
import { CustomMarker } from "../map/markers/custommarker";
import { SVGInjector } from "@tanem/svg-injector";
import { AirbaseChartData, AirbaseOptions } from "../interfaces";
import { getApp } from "../olympusapp";
import { OlympusState } from "../constants/constants";
import { AirbaseSelectedEvent } from "../events";

// TODO add ability to select the marker
export class Airbase extends CustomMarker {
  #name: string = "";
  #chartData: AirbaseChartData = {
    elevation: "",
    ICAO: "",
    TACAN: "",
    runways: [],
  };
  #coalition: string = "";
  #properties: string[] = [];
  #parkings: string[] = [];
  #img: HTMLImageElement;
  #selected: boolean = false;

  constructor(options: AirbaseOptions) {
    super(options.position, { riseOnHover: true });

    this.#name = options.name;
    this.#img = document.createElement("img");

    AirbaseSelectedEvent.on((airbase) => {
      this.#selected = airbase == this;
      if (this.getElement()?.querySelector(".airbase-icon"))
        (this.getElement()?.querySelector(".airbase-icon") as HTMLElement).dataset.selected = `${this.#selected}`;
    })

    this.addEventListener("click", (ev) => {
      if (getApp().getState() === OlympusState.IDLE || getApp().getState() === OlympusState.AIRBASE) {
        getApp().setState(OlympusState.AIRBASE)
        AirbaseSelectedEvent.dispatch(this)
      }
    });
  }

  createIcon() {
    var icon = new DivIcon({
      className: "leaflet-airbase-marker",
      iconSize: [40, 40],
      iconAnchor: [20, 20],
    }); // Set the marker, className must be set to avoid white square
    this.setIcon(icon);

    var el = document.createElement("div");
    el.classList.add("airbase-icon");
    el.setAttribute("data-object", "airbase");

    this.#img.src = "/vite/images/markers/airbase.svg";
    this.#img.onload = () => SVGInjector(this.#img);
    el.appendChild(this.#img);
    this.getElement()?.appendChild(el);
    el.dataset.coalition = this.#coalition;
  }

  setCoalition(coalition: string) {
    this.#coalition = coalition;
    (this.getElement()?.querySelector(".airbase-icon") as HTMLElement).dataset.coalition = this.#coalition;
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

  getImg() {
    return this.#img;
  }
}
