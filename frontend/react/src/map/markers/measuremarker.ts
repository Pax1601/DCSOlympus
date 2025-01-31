import { Marker, LatLng, DivIcon, Map } from "leaflet";

export class MeasureMarker extends Marker {
  #textValue: string;
  #isEditable: boolean = false;
  #rotationAngle: number; // Rotation angle in radians
  #previousValue: string;

  onValueUpdated: (value: number) => void = () => {};
  onDeleteButtonClicked: () => void = () => {};

  /**
   * Constructor for SpotEditMarker
   * @param {LatLng} latlng - The geographical position of the marker.
   * @param {string} textValue - The initial text value to display.
   * @param {number} rotationAngle - The initial rotation angle in radians.
   */
  constructor(latlng: LatLng, textValue: string, rotationAngle: number = 0) {
    super(latlng, {
      icon: new DivIcon({
        className: "leaflet-measure-marker",
        html: `<div class="container">
        <div class="text">${textValue}</div>
        </div>`,
      }),
    });

    this.#textValue = textValue;
    this.#rotationAngle = rotationAngle;
  }

  /**
   * Sets the text value of the marker.
   * @param {string} textValue - The new text value.
   */
  setTextValue(textValue: string) {
    this.#textValue = textValue;
    const element = this.getElement();
    if (element) {
      const text = element.querySelector(".text");
      if (text) text.textContent = textValue;
    }
  }

  /**
   * Gets the text value of the marker.
   * @returns {string} - The current text value.
   */
  getTextValue() {
    return this.#textValue;
  }

  /**
   * Sets the rotation angle of the marker in radians.
   * @param {number} angle - The new rotation angle in radians.
   */
  setRotationAngle(angle: number) {
    this.#rotationAngle = angle;
    if (!this.#isEditable) {
      this.#updateRotation();
    }
  }

  /**
   * Gets the rotation angle of the marker in radians.
   * @returns {number} - The current rotation angle in radians.
   */
  getRotationAngle() {
    return this.#rotationAngle;
  }

  /**
   * Updates the rotation angle to ensure the text is always readable.
   */
  #updateRotation() {
    const element = this.getElement();
    if (element) {
      const container = element.querySelector(".container") as HTMLDivElement;
      if (container) {
        let angle = this.#rotationAngle % (2 * Math.PI);
        if (angle < 0) angle += 2 * Math.PI;
        if (angle > Math.PI / 2 && angle < (3 * Math.PI) / 2) {
          angle = (angle + Math.PI) % (2 * Math.PI); // Flip the text to be upright
        }
        const angleInDegrees = angle * (180 / Math.PI);
        container.style.transform = `rotate(${angleInDegrees}deg)`;
      }
    }
  }
}
