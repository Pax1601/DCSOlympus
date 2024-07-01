import { LatLng, DivIcon, Map } from "leaflet";
import { getApp } from "../olympusapp";
import {
  enumToCoalition,
  mToFt,
  msToKnots,
  rad2deg,
  zeroAppend,
} from "../other/utils";
import { CustomMarker } from "../map/markers/custommarker";
import { SVGInjector } from "@tanem/svg-injector";
import {
  DLINK,
  DataIndexes,
  GAME_MASTER,
  IRST,
  OPTIC,
  RADAR,
  VISUAL,
} from "../constants/constants";
import { DataExtractor } from "../server/dataextractor";
import { ObjectIconOptions } from "../interfaces";

export class Weapon extends CustomMarker {
  ID: number;

  #alive: boolean = false;
  #coalition: string = "neutral";
  #name: string = "";
  #position: LatLng = new LatLng(0, 0, 0);
  #speed: number = 0;
  #heading: number = 0;

  #hidden: boolean = false;
  #detectionMethods: number[] = [];

  getAlive() {
    return this.#alive;
  }
  getCoalition() {
    return this.#coalition;
  }
  getName() {
    return this.#name;
  }
  getPosition() {
    return this.#position;
  }
  getSpeed() {
    return this.#speed;
  }
  getHeading() {
    return this.#heading;
  }

  static getConstructor(type: string) {
    if (type === "Missile") return Missile;
    if (type === "Bomb") return Bomb;
  }

  constructor(ID: number) {
    super(new LatLng(0, 0), { riseOnHover: true, keyboard: false });

    this.ID = ID;

    /* Update the marker when the options change */
    document.addEventListener("mapOptionsChanged", (ev: CustomEventInit) => {
      this.#updateMarker();
    });
  }

  getCategory() {
    // Overloaded by child classes
    return "";
  }

  /********************** Unit data *************************/
  setData(dataExtractor: DataExtractor) {
    var updateMarker = !getApp().getMap().hasLayer(this);

    var datumIndex = 0;
    while (datumIndex != DataIndexes.endOfData) {
      datumIndex = dataExtractor.extractUInt8();
      switch (datumIndex) {
        case DataIndexes.category:
          dataExtractor.extractString();
          break;
        case DataIndexes.alive:
          this.setAlive(dataExtractor.extractBool());
          updateMarker = true;
          break;
        case DataIndexes.coalition:
          this.#coalition = enumToCoalition(dataExtractor.extractUInt8());
          break;
        case DataIndexes.name:
          this.#name = dataExtractor.extractString();
          break;
        case DataIndexes.position:
          this.#position = dataExtractor.extractLatLng();
          updateMarker = true;
          break;
        case DataIndexes.speed:
          this.#speed = dataExtractor.extractFloat64();
          updateMarker = true;
          break;
        case DataIndexes.heading:
          this.#heading = dataExtractor.extractFloat64();
          updateMarker = true;
          break;
      }
    }

    if (updateMarker) this.#updateMarker();
  }

  getData() {
    return {
      category: this.getCategory(),
      ID: this.ID,
      alive: this.#alive,
      coalition: this.#coalition,
      name: this.#name,
      position: this.#position,
      speed: this.#speed,
      heading: this.#heading,
    };
  }

  getMarkerCategory(): string {
    return "";
  }

  getIconOptions(): ObjectIconOptions {
    // Default values, overloaded by child classes if needed
    return {
      showState: false,
      showVvi: false,
      showHealth: false,
      showHotgroup: false,
      showUnitIcon: true,
      showShortLabel: false,
      showFuel: false,
      showAmmo: false,
      showSummary: true,
      showCallsign: true,
      rotateToHeading: false,
    };
  }

  setAlive(newAlive: boolean) {
    this.#alive = newAlive;
  }

  belongsToCommandedCoalition() {
    if (
      getApp().getMissionManager().getCommandModeOptions().commandMode !==
        GAME_MASTER &&
      getApp().getMissionManager().getCommandedCoalition() !== this.#coalition
    )
      return false;
    return true;
  }

  getType() {
    return "";
  }

  /********************** Icon *************************/
  createIcon(): void {
    /* Set the icon */
    var icon = new DivIcon({
      className: "leaflet-unit-icon",
      iconAnchor: [25, 25],
      iconSize: [50, 50],
    });
    this.setIcon(icon);

    var el = document.createElement("div");
    el.classList.add("unit");
    el.setAttribute("data-object", `unit-${this.getMarkerCategory()}`);
    el.setAttribute("data-coalition", this.#coalition);

    // Generate and append elements depending on active options
    // Velocity vector
    if (this.getIconOptions().showVvi) {
      var vvi = document.createElement("div");
      vvi.classList.add("unit-vvi");
      vvi.toggleAttribute("data-rotate-to-heading");
      el.append(vvi);
    }

    // Main icon
    if (this.getIconOptions().showUnitIcon) {
      var unitIcon = document.createElement("div");
      unitIcon.classList.add("unit-icon");
      var img = document.createElement("img");
      img.src = `/resources/theme/images/units/${this.getMarkerCategory()}.svg`;
      img.onload = () => SVGInjector(img);
      unitIcon.appendChild(img);
      unitIcon.toggleAttribute(
        "data-rotate-to-heading",
        this.getIconOptions().rotateToHeading
      );
      el.append(unitIcon);
    }

    this.getElement()?.appendChild(el);
  }

  /********************** Visibility *************************/
  updateVisibility() {
    const hiddenUnits = getApp().getMap().getHiddenTypes();
    var hidden =
      hiddenUnits[this.getMarkerCategory()] ||
      hiddenUnits[this.#coalition] ||
      (!this.belongsToCommandedCoalition() &&
        this.#detectionMethods.length == 0);

    this.setHidden(hidden || !this.#alive);
  }

  setHidden(hidden: boolean) {
    this.#hidden = hidden;

    /* Add the marker if not present */
    if (!getApp().getMap().hasLayer(this) && !this.getHidden()) {
      if (getApp().getMap().isZooming())
        this.once("zoomend", () => {
          this.addTo(getApp().getMap());
        });
      else this.addTo(getApp().getMap());
    }

    /* Hide the marker if necessary*/
    if (getApp().getMap().hasLayer(this) && this.getHidden()) {
      getApp().getMap().removeLayer(this);
    }
  }

  getHidden() {
    return this.#hidden;
  }

  setDetectionMethods(newDetectionMethods: number[]) {
    if (!this.belongsToCommandedCoalition()) {
      /* Check if the detection methods of this unit have changed */
      if (
        this.#detectionMethods.length !== newDetectionMethods.length ||
        this.getDetectionMethods().some(
          (value) => !newDetectionMethods.includes(value)
        )
      ) {
        /* Force a redraw of the unit to reflect the new status of the detection methods */
        this.setHidden(true);
        this.#detectionMethods = newDetectionMethods;
        this.#updateMarker();
      }
    }
  }

  getDetectionMethods() {
    return this.#detectionMethods;
  }

  /***********************************************/
  onAdd(map: Map): this {
    super.onAdd(map);
    return this;
  }

  #updateMarker() {
    this.updateVisibility();

    /* Draw the marker */
    if (!this.getHidden()) {
      if (
        this.getLatLng().lat !== this.#position.lat ||
        this.getLatLng().lng !== this.#position.lng
      ) {
        this.setLatLng(new LatLng(this.#position.lat, this.#position.lng));
      }

      var element = this.getElement();
      if (element != null) {
        /* Draw the velocity vector */
        element
          .querySelector(".unit-vvi")
          ?.setAttribute("style", `height: ${15 + this.#speed / 5}px;`);

        /* Set dead/alive flag */
        element
          .querySelector(".unit")
          ?.toggleAttribute("data-is-dead", !this.#alive);

        /* Set altitude and speed */
        if (element.querySelector(".unit-altitude"))
          (<HTMLElement>element.querySelector(".unit-altitude")).innerText =
            "FL" +
            zeroAppend(
              Math.floor(mToFt(this.#position.alt as number) / 100),
              3
            );
        if (element.querySelector(".unit-speed"))
          (<HTMLElement>element.querySelector(".unit-speed")).innerText =
            String(Math.floor(msToKnots(this.#speed))) + "GS";

        /* Rotate elements according to heading */
        element.querySelectorAll("[data-rotate-to-heading]").forEach((el) => {
          const headingDeg = rad2deg(this.#heading);
          let currentStyle = el.getAttribute("style") || "";
          el.setAttribute(
            "style",
            currentStyle + `transform:rotate(${headingDeg}deg);`
          );
        });
      }

      /* Set vertical offset for altitude stacking */
      var pos = getApp().getMap().latLngToLayerPoint(this.getLatLng()).round();
      this.setZIndexOffset(
        1000 + Math.floor(this.#position.alt as number) - pos.y
      );
    }
  }
}

export class Missile extends Weapon {
  constructor(ID: number) {
    super(ID);
  }

  getCategory() {
    return "Missile";
  }

  getMarkerCategory() {
    if (
      this.belongsToCommandedCoalition() ||
      this.getDetectionMethods().includes(VISUAL) ||
      this.getDetectionMethods().includes(OPTIC)
    )
      return "missile";
    else return "aircraft";
  }

  getIconOptions() {
    return {
      showState: false,
      showVvi:
        !this.belongsToCommandedCoalition() &&
        !this.getDetectionMethods().some((value) =>
          [VISUAL, OPTIC].includes(value)
        ) &&
        this.getDetectionMethods().some((value) =>
          [RADAR, IRST, DLINK].includes(value)
        ),
      showHealth: false,
      showHotgroup: false,
      showUnitIcon:
        this.belongsToCommandedCoalition() ||
        this.getDetectionMethods().some((value) =>
          [VISUAL, OPTIC, RADAR, IRST, DLINK].includes(value)
        ),
      showShortLabel: false,
      showFuel: false,
      showAmmo: false,
      showSummary:
        !this.belongsToCommandedCoalition() &&
        !this.getDetectionMethods().some((value) =>
          [VISUAL, OPTIC].includes(value)
        ) &&
        this.getDetectionMethods().some((value) =>
          [RADAR, IRST, DLINK].includes(value)
        ),
      showCallsign: false,
      rotateToHeading:
        this.belongsToCommandedCoalition() ||
        this.getDetectionMethods().includes(VISUAL) ||
        this.getDetectionMethods().includes(OPTIC),
    };
  }
}

export class Bomb extends Weapon {
  constructor(ID: number) {
    super(ID);
  }

  getCategory() {
    return "Bomb";
  }

  getMarkerCategory() {
    if (
      this.belongsToCommandedCoalition() ||
      this.getDetectionMethods().includes(VISUAL) ||
      this.getDetectionMethods().includes(OPTIC)
    )
      return "bomb";
    else return "aircraft";
  }

  getIconOptions() {
    return {
      showState: false,
      showVvi:
        !this.belongsToCommandedCoalition() &&
        !this.getDetectionMethods().some((value) =>
          [VISUAL, OPTIC].includes(value)
        ) &&
        this.getDetectionMethods().some((value) =>
          [RADAR, IRST, DLINK].includes(value)
        ),
      showHealth: false,
      showHotgroup: false,
      showUnitIcon:
        this.belongsToCommandedCoalition() ||
        this.getDetectionMethods().some((value) =>
          [VISUAL, OPTIC, RADAR, IRST, DLINK].includes(value)
        ),
      showShortLabel: false,
      showFuel: false,
      showAmmo: false,
      showSummary:
        !this.belongsToCommandedCoalition() &&
        !this.getDetectionMethods().some((value) =>
          [VISUAL, OPTIC].includes(value)
        ) &&
        this.getDetectionMethods().some((value) =>
          [RADAR, IRST, DLINK].includes(value)
        ),
      showCallsign: false,
      rotateToHeading:
        this.belongsToCommandedCoalition() ||
        this.getDetectionMethods().includes(VISUAL) ||
        this.getDetectionMethods().includes(OPTIC),
    };
  }
}
