import { LatLng, Polyline } from "leaflet";
import { Map } from "./map";
import { MeasureMarker } from "./markers/measuremarker";
import { MeasureStartMarker } from "./markers/measurestartmarker";
import { MeasureEndMarker } from "./markers/measureendmarker";
import { bearing, deg2rad, midpoint, mToFt, mToNm, nmToM, rad2deg } from "../other/utils";

export class Measure {
  #active: boolean = false;
  #map: Map;
  #line: Polyline;
  #measureMarker: MeasureMarker;
  #startMarker: MeasureStartMarker;
  #endMarker: MeasureEndMarker;
  #totalDistance: number = 0;
  onMarkerMoved: (startLatLng: LatLng, endLatLng: LatLng) => void = () => {};

  constructor(map) {
    this.#map = map;
  }

  onClick(latlng: LatLng) {
    if (this.#startMarker === undefined) {
      this.#startMarker = new MeasureStartMarker(latlng).addTo(this.#map);

      this.#endMarker = new MeasureEndMarker(latlng).addTo(this.#map);
      this.#line = new Polyline([this.#startMarker.getLatLng(), this.#endMarker.getLatLng()], { color: "#FFFFFF", dashArray: "5, 5" }).addTo(this.#map);
      this.#measureMarker = new MeasureMarker(new LatLng(0, 0), "", 0).addTo(this.#map);

      this.#startMarker.on("drag", (event) => {
        this.#onMarkersMove();
      });

      this.#endMarker.on("drag", (event) => {
        this.#onMarkersMove();
      });

      this.#active = true;
    }
  }

  onMouseMove(latlng: LatLng) {
    if (this.#endMarker !== undefined && this.isActive()) {
      this.#endMarker.setLatLng(latlng);
      this.#onMarkersMove();
    }
  }

  remove() {
    if (this.#startMarker !== undefined) this.#map.removeLayer(this.#startMarker);
    if (this.#endMarker !== undefined) this.#map.removeLayer(this.#endMarker);
    if (this.#line !== undefined) this.#map.removeLayer(this.#line);
    if (this.#measureMarker !== undefined) this.#map.removeLayer(this.#measureMarker);
  }

  hideEndMarker() {
    if (this.#endMarker !== undefined) this.#map.removeLayer(this.#endMarker);
  }

  showEndMarker() {
    this.#onMarkersMove();
    if (this.#endMarker !== undefined) this.#endMarker.addTo(this.#map);
  }

  moveMarkers(startLatLng: LatLng | null, endLatLng: LatLng | null) {
    startLatLng && this.#startMarker.setLatLng(startLatLng);
    endLatLng && this.#endMarker.setLatLng(endLatLng);
    this.#onMarkersMove();
  }

  getDistance() {
    return this.#startMarker.getLatLng().distanceTo(this.#endMarker.getLatLng());
  }

  finish() {
    this.#active = false;
    this.#endMarker.setMoving(false);
  }

  isActive() {
    return this.#active;
  }

  setTotalDistance(distance: number) {
    this.#totalDistance = distance;
  }

  #onMarkersMove() {
    const distance = this.#startMarker.getLatLng().distanceTo(this.#endMarker.getLatLng());
    let distanceString = "";
    if (distance > nmToM(1)) distanceString = `${mToNm(distance).toFixed(distance < nmToM(10) ? 2 : 0)} NM`;
    else distanceString = `${mToFt(distance).toFixed(0)} ft`;
    const bearingTo = deg2rad(
      bearing(this.#startMarker.getLatLng().lat, this.#startMarker.getLatLng().lng, this.#endMarker.getLatLng().lat, this.#endMarker.getLatLng().lng, false)
    );

    if (this.#totalDistance > 0) {
      if (this.#totalDistance + this.getDistance() > nmToM(1)) distanceString += ` / ${mToNm(this.#totalDistance + this.getDistance()).toFixed(0)} NM`;
      else distanceString += ` / ${mToFt(this.#totalDistance + this.getDistance()).toFixed(0)} ft`;
    }

    const halfPoint = midpoint(
      this.#startMarker.getLatLng().lat,
      this.#startMarker.getLatLng().lng,
      this.#endMarker.getLatLng().lat,
      this.#endMarker.getLatLng().lng
    );
    const bearingString = `${Math.floor(rad2deg(bearingTo) + 360) % 360}°`;
    this.#measureMarker.setLatLng(halfPoint);
    this.#measureMarker.setRotationAngle(bearingTo + Math.PI / 2);
    this.#measureMarker.setTextValue(`${distanceString} - ${bearingString}`);
    this.#endMarker.setRotationAngle(bearingTo);
    this.#line.setLatLngs([this.#startMarker.getLatLng(), this.#endMarker.getLatLng()]);

    this.onMarkerMoved(this.#startMarker.getLatLng(), this.#endMarker.getLatLng());
  }
}
