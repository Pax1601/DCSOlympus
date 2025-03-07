import { Marker, LatLng, DivIcon, Map } from "leaflet";

export class SpotEditMarker extends Marker {
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
  constructor(latlng: LatLng, textValue: string, rotationAngle: number = 0, type: string) {
    super(latlng, {
      icon: new DivIcon({
        className: "leaflet-spot-input-marker",
        html:
          type === "laser"
            ? `<div class="container">
        <input class="input"/>
        <div class="text">${textValue}</div>
        <div class="delete">X</div>
        </div>`
            : `<div class="container">
        <div class="delete">X</div>
        </div>`,
      }),
    });

    this.#textValue = textValue;
    this.#rotationAngle = rotationAngle;
    this.#previousValue = textValue;
  }

  /**
   * Called when the marker is added to the map.
   * @param {Map} map - The map instance.
   * @returns {this} - The current instance of SpotEditMarker.
   */
  onAdd(map: Map): this {
    super.onAdd(map);
    const element = this.getElement();
    if (element) {
      const container = element.querySelector(".container") as HTMLDivElement;
      const button = element.querySelector(".delete") as HTMLDivElement;
      const input = element.querySelector(".input") as HTMLInputElement;

      // Add click event listener to toggle edit mode
      container?.addEventListener("mousedown", (ev) => {
        ev.stopPropagation();
        ev.preventDefault();
        this.#setEditMode(ev, !this.#isEditable);
      });
      container?.addEventListener("mouseup", (ev) => this.#stopEventPropagation(ev));
      container?.addEventListener("dblclick", (ev) => this.#stopEventPropagation(ev));

      // Add click event listener to delete spot
      button?.addEventListener("mousedown", (ev) => {
        ev.stopPropagation();
        ev.preventDefault();
        this.#onButtonClicked(ev);
      });
      button?.addEventListener("mouseup", (ev) => this.#stopEventPropagation(ev));
      button?.addEventListener("dblclick", (ev) => this.#stopEventPropagation(ev));

      // Add click event listener to input spot
      input?.addEventListener("mousedown", (ev) => this.#stopEventPropagation(ev));
      input?.addEventListener("mouseup", (ev) => this.#stopEventPropagation(ev));
      input?.addEventListener("dblclick", (ev) => this.#stopEventPropagation(ev));
      input?.addEventListener("blur", (ev) => this.#setEditMode(ev, false));
      input?.addEventListener("keydown", (ev) => this.#onKeyDown(ev));
      input?.addEventListener("input", (ev) => this.#validateInput(ev));
    }

    return this;
  }

  /**
   * Called when the marker is removed from the map.
   * @param {Map} map - The map instance.
   * @returns {this} - The current instance of SpotEditMarker.
   */
  onRemove(map: Map): this {
    super.onRemove(map);

    const element = this.getElement();
    if (element) {
      const container = element.querySelector(".container") as HTMLDivElement;
      const button = element.querySelector(".delete") as HTMLDivElement;
      const input = element.querySelector(".input") as HTMLInputElement;

      // Remove click event listener to toggle edit mode
      container?.removeEventListener("mousedown", (ev) => {
        ev.stopPropagation();
        ev.preventDefault();
        this.#setEditMode(ev, !this.#isEditable);
      });
      container?.removeEventListener("mouseup", (ev) => this.#stopEventPropagation(ev));
      container?.removeEventListener("dblclick", (ev) => this.#stopEventPropagation(ev));

      // Remove click event listener to delete spot
      button?.removeEventListener("mousedown", (ev) => {
        ev.stopPropagation();
        ev.preventDefault();
        this.#onButtonClicked(ev);
      });
      button?.removeEventListener("mouseup", (ev) => this.#stopEventPropagation(ev));
      button?.removeEventListener("dblclick", (ev) => this.#stopEventPropagation(ev));

      // Remove click event listener to input spot
      input?.removeEventListener("mousedown", (ev) => this.#stopEventPropagation(ev));
      input?.removeEventListener("mouseup", (ev) => this.#stopEventPropagation(ev));
      input?.removeEventListener("dblclick", (ev) => this.#stopEventPropagation(ev));
      input?.removeEventListener("blur", (ev) => this.#setEditMode(ev, false));
      input?.removeEventListener("keydown", (ev) => this.#onKeyDown(ev));
      input?.removeEventListener("input", (ev) => this.#validateInput(ev));
    }

    return this;
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

  /**
   * Toggles the edit mode of the marker.
   * @param {Event} ev - The event object.
   */
  #setEditMode(ev: Event, editable: boolean) {
    this.#isEditable = editable;

    const element = this.getElement();
    if (element) {
      const textElement = element.querySelector(".text");
      const inputElement = element.querySelector(".input") as HTMLInputElement;
      const buttonElement = element.querySelector(".delete");
      const container = element.querySelector(".container") as HTMLDivElement;
      if (this.#isEditable) {
        // Rotate to horizontal and make text editable
        if (textElement && inputElement && buttonElement) {
          textElement.classList.add("edit-mode");
          inputElement.style.display = "block";
          inputElement.value = this.#textValue;
          inputElement.focus();
          buttonElement.textContent = "✔"; // Change to check mark
          buttonElement.classList.add("edit-mode");
        }
        container.style.transform = `rotate(0deg)`;
      } else {
        // Save the edited text and revert to normal mode
        if (textElement && inputElement && buttonElement) {
          const newText = inputElement.value || this.#textValue;
          this.#textValue = newText;
          textElement.classList.remove("edit-mode");
          inputElement.style.display = "none";
          buttonElement.textContent = "X"; // Change to delete mark
          buttonElement.classList.remove("edit-mode");
        }
        this.#updateRotation();
      }
    }
  }

  /**
   * Stops the event propagation.
   * @param {Event} ev - The event object.
   */
  #stopEventPropagation(ev: Event) {
    ev.stopPropagation();
  }

  /**
   * Validates the input value.
   * @param {Event} ev - The event object.
   */
  #validateInput(ev: Event) {
    const element = this.getElement();
    if (element) {
      const input = ev.target as HTMLInputElement;
      const text = element.querySelector(".text");

      // Validate the input value (must be a valid laser code)
      const value = input.value;

      // Check if the value is a partial valid input
      // Conditions for partial validity:
      // 1. The first digit is 1.
      // 2. The first digit is 1 and the second digit is between 1 and 7.
      // 3. The first digit is 1, the second digit is between 1 and 7, and the third digit is between 1 and 8.
      // 4. The first digit is 1, the second digit is between 1 and 7, the third digit is between 1 and 8, and the fourth digit is between 1 and 8.
      const isPartialValid = /^[1]$|^[1][1-7]$|^[1][1-7][1-8]$|^[1][1-7][1-8][1-8]$/.test(value);

      // Check if the value is a complete valid input
      // Conditions for complete validity:
      // 1. The input is a four-digit number where:
      //    - The first digit is 1.
      //    - The second digit is between 1 and 7.
      //    - The third digit is between 1 and 8.
      //    - The fourth digit is between 1 and 8.
      // 2. The number is between 1111 and 1788.
      const isValid = /^[1][1-7][1-8][1-8]$/.test(value) && Number(value) <= 1788;

      if (isPartialValid || isValid) {
        if (text) text.textContent = value;
        this.#previousValue = value;
      } else {
        this.#errorFunction();
        input.value = this.#previousValue;
        if (text) text.textContent = this.#previousValue;
      }
    }
  }

  /**
   * Handles invalid input by causing a small red flash around the input element.
   */
  #errorFunction() {
    const element = this.getElement();
    if (element) {
      const input = element.querySelector(".input") as HTMLInputElement;
      if (input) {
        input.classList.add("error-flash");
        setTimeout(() => {
          input.classList.remove("error-flash");
        }, 300); // Duration of the flash effect
      }
    }
  }

  /**
   * Handles the key down event.
   * @param {Event} ev - The keyboard event object.
   */
  #onKeyDown(ev) {
    if (ev.key === "Enter") this.#acceptInput(ev);
    else if (ev.key === "Escape") this.#setEditMode(ev, false);
  }

  /**
   * Accepts the input value when the Enter key is pressed.
   * @param {Event} ev - The keyboard event object.
   */
  #acceptInput(ev) {
    const element = this.getElement();
    if (element) {
      const input = element.querySelector(".input") as HTMLInputElement;
      if (input) {
        // Validate the input value (must be a valid laser code)
        const value = Number(input.value);
        if (value >= 1111 && value <= 1788) {
          this.#setEditMode(ev, false);
          this.onValueUpdated(value);
          this.#successFunction();
        } else {
          this.#errorFunction();
        }
      }
    }
  }

  /**
   * Handles the button click event.
   * @param {Event} ev - The event object.
   */
  #onButtonClicked(ev: Event) {
    if (this.#isEditable) this.#acceptInput(ev);
    else this.onDeleteButtonClicked();
  }

  /**
   * Handles valid input by causing a green flash around the container.
   */
  #successFunction() {
    const element = this.getElement();
    if (element) {
      const container = element.querySelector(".container") as HTMLDivElement;
      if (container) {
        container.classList.add("success-flash");
        setTimeout(() => {
          container.classList.remove("success-flash");
        }, 900); // Duration of the flash effect (3 flashes, 300ms each)
      }
    }
  }
}
