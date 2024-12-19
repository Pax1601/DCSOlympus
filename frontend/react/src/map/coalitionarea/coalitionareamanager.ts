import { LatLng, LeafletMouseEvent } from "leaflet";
import { DrawSubState, OlympusState } from "../../constants/constants";
import { AppStateChangedEvent, CoalitionAreaChangedEvent, CoalitionAreasChangedEvent, CoalitionAreaSelectedEvent, SessionDataLoadedEvent } from "../../events";
import { getApp } from "../../olympusapp";
import { areaContains } from "../../other/utils";
import { CoalitionCircle } from "./coalitioncircle";
import { CoalitionPolygon } from "./coalitionpolygon";
import { SessionData } from "../../interfaces";

export class CoalitionAreasManager {
  /* Coalition areas drawing */
  #areas: (CoalitionPolygon | CoalitionCircle)[] = [];
  #selectedArea: CoalitionCircle | CoalitionPolygon | null = null;

  constructor() {
    AppStateChangedEvent.on((state, subState) => {
      /* State changes can't happen inside a AppStateChanged handler. Use a timeout */
      window.setTimeout(() => {
        this.getSelectedArea()?.setCreating(false);

        if (state !== OlympusState.DRAW || (state === OlympusState.DRAW && subState === DrawSubState.NO_SUBSTATE)) {
          this.setSelectedArea(null);
        } else {
          /* If we are editing but no area is selected, revert to no substate */
          if (subState === DrawSubState.EDIT && this.getSelectedArea() === null) getApp().setState(OlympusState.DRAW);
          else {
            /* Handle creation of new area */
            let newArea: CoalitionCircle | CoalitionPolygon | null = null;
            if (subState == DrawSubState.DRAW_POLYGON) newArea = new CoalitionPolygon([]);
            else if (subState === DrawSubState.DRAW_CIRCLE) newArea = new CoalitionCircle(new LatLng(0, 0), { radius: 1000 });

            if (newArea) {
              this.setSelectedArea(newArea);
              this.#areas.push(newArea);
              CoalitionAreasChangedEvent.dispatch(this.#areas);
            }
          }
        }
      }, 200);
    });

    CoalitionAreaChangedEvent.on((area) => {
      CoalitionAreasChangedEvent.dispatch(this.#areas);
    });

    SessionDataLoadedEvent.on((sessionData: SessionData) => {
      /* Make a local copy */
      const localSessionData = JSON.parse(JSON.stringify(sessionData)) as SessionData;
      this.#areas.forEach((area) => this.deleteCoalitionArea(area));
      localSessionData.coalitionAreas?.forEach((options) => {
        if (options.type === 'circle') {
          let newCircle = new CoalitionCircle(new LatLng(options.latlng.lat, options.latlng.lng), { radius: options.radius }, false);
          newCircle.setCoalition(options.coalition);
          newCircle.setLabelText(options.label);
          newCircle.setSelected(false);
          this.#areas.push(newCircle);
        } else if (options.type === 'polygon') {
          if (options.latlngs.length >= 3) {
            let newPolygon = new CoalitionPolygon(options.latlngs.map((latlng) => new LatLng(latlng.lat, latlng.lng)), {}, false);
            newPolygon.setCoalition(options.coalition);
            newPolygon.setLabelText(options.label);
            newPolygon.setSelected(false);
            this.#areas.push(newPolygon);
          }
        }
      });
      CoalitionAreasChangedEvent.dispatch(this.#areas);
    });
  }

  setSelectedArea(area: CoalitionCircle | CoalitionPolygon | null) {
    this.#selectedArea?.setSelected(this.#selectedArea === area);
    area?.setSelected(true);
    this.#selectedArea = area;
    CoalitionAreaSelectedEvent.dispatch(area);
  }

  deleteCoalitionArea(area: CoalitionPolygon | CoalitionCircle) {
    if (!this.#areas.includes(area)) return;

    if (area === this.getSelectedArea()) this.setSelectedArea(null);

    this.#areas.splice(this.#areas.indexOf(area), 1);
    if (getApp().getMap().hasLayer(area)) getApp().getMap().removeLayer(area);
    CoalitionAreasChangedEvent.dispatch(this.#areas);
  }

  moveAreaUp(area: CoalitionPolygon | CoalitionCircle) {
    if (!this.#areas.includes(area)) return;

    const idx = this.#areas.indexOf(area);

    if (idx === 0) return;

    this.#areas.forEach((coalitionArea) => getApp().getMap().removeLayer(coalitionArea));
    this.#areas.splice(this.#areas.indexOf(area), 1);
    this.#areas = [...this.#areas.slice(0, idx - 1), area, ...this.#areas.slice(idx - 1)];
    this.#areas.forEach((coalitionArea) => getApp().getMap().addLayer(coalitionArea));
    CoalitionAreasChangedEvent.dispatch(this.#areas);
  }

  moveCoalitionAreaDown(area: CoalitionPolygon | CoalitionCircle) {
    if (!this.#areas.includes(area)) return;

    const idx = this.#areas.indexOf(area);

    if (idx === this.#areas.length - 1) return;

    this.#areas.forEach((coalitionArea) => getApp().getMap().removeLayer(coalitionArea));
    this.#areas.splice(this.#areas.indexOf(area), 1);
    this.#areas = [...this.#areas.slice(0, idx + 1), area, ...this.#areas.slice(idx + 1)];
    this.#areas.forEach((coalitionArea) => getApp().getMap().addLayer(coalitionArea));
    CoalitionAreasChangedEvent.dispatch(this.#areas);
  }

  getSelectedArea() {
    return this.#areas.find((coalitionArea: CoalitionPolygon | CoalitionCircle) => coalitionArea.getSelected()) ?? null;
  }

  onLeftShortClick(e: LeafletMouseEvent) {
    const selectedArea = this.getSelectedArea();
    if (getApp().getSubState() === DrawSubState.DRAW_POLYGON) {
      if (selectedArea && selectedArea instanceof CoalitionPolygon) selectedArea.addTemporaryLatLng(e.latlng);
    } else if (getApp().getSubState() === DrawSubState.DRAW_CIRCLE) {
      if (selectedArea && selectedArea instanceof CoalitionCircle) {
        if (selectedArea.getLatLng().lat == 0 && selectedArea.getLatLng().lng == 0) selectedArea.setLatLng(e.latlng);
        getApp().setState(OlympusState.DRAW, DrawSubState.EDIT);
      }
    } else {
      let wasAreaSelected = this.getSelectedArea() !== null;

      this.setSelectedArea(null);
      for (let idx = 0; idx < this.#areas.length; idx++) {
        if (areaContains(e.latlng, this.#areas[idx])) {
          this.setSelectedArea(this.#areas[idx]);
          getApp().setState(OlympusState.DRAW, DrawSubState.EDIT);
          break;
        }
      }

      if (this.getSelectedArea() === null) getApp().setState(wasAreaSelected ? OlympusState.DRAW : OlympusState.IDLE);
    }
  }

  onDoubleClick(e: LeafletMouseEvent) {
    if (getApp().getSubState() === DrawSubState.DRAW_CIRCLE || getApp().getSubState() === DrawSubState.DRAW_POLYGON)
      getApp().setState(OlympusState.DRAW, DrawSubState.EDIT);
    else getApp().setState(OlympusState.DRAW);
  }

  getAreas() {
    return this.#areas;
  }
}
