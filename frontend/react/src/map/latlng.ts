import * as L from "leaflet";

export class LatLng extends L.LatLng {
  threshold: number;
  
  constructor(lat: number, lng: number, alt: number, threshold: number) {
    super(lat, lng, alt);
    this.threshold = threshold;
  }

  setThreshold(threshold: number) {
    this.threshold = threshold;
  }

  getThreshold() {
    return this.threshold;
  }
}
