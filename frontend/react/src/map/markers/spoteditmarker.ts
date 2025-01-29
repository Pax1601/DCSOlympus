import { Marker, LatLng, DivIcon, DomEvent, Map } from "leaflet";

export class SpotEditMarker extends Marker {
  #textValue: string;
  #isEditable: boolean = false;
  #rotationAngle: number; // Rotation angle in radians
  #previousValue: string;

  constructor(latlng: LatLng, textValue: string, rotationAngle: number = 0) {
    super(latlng, {
      icon: new DivIcon({
        className: "leaflet-spot-input-marker",
        html: `<div class="container">
        <input class="input"/>
        <div class="text">${textValue}</div>
        <div class="delete">X</div>
        </div>`,
      }),
    });

    this.#textValue = textValue;
    this.#rotationAngle = rotationAngle;
    this.#previousValue = textValue;
  }

  onAdd(map: Map): this {
    super.onAdd(map);
    const element = this.getElement();
    if (element) {
      const text = element.querySelector(".text");
      const button = element.querySelector(".delete");
      const input = element.querySelector(".input") as HTMLInputElement;

      // Add click event listener to toggle edit mode
      text?.addEventListener("mousedown", (ev) => this.#toggleEditMode(ev));
      text?.addEventListener("mouseup", (ev) => this.#stopEventPropagation(ev));
      text?.addEventListener("dblclick", (ev) => this.#stopEventPropagation(ev));

      // Add click event listener to delete spot
      button?.addEventListener("mousedown", (ev) => this.#stopEventPropagation(ev));
      button?.addEventListener("mouseup", (ev) => this.#stopEventPropagation(ev));
      button?.addEventListener("dblclick", (ev) => this.#stopEventPropagation(ev));

      // Add click event listener to input spot
      input?.addEventListener("mousedown", (ev) => this.#stopEventPropagation(ev));
      input?.addEventListener("mouseup", (ev) => this.#stopEventPropagation(ev));
      input?.addEventListener("dblclick", (ev) => this.#stopEventPropagation(ev));
      input?.addEventListener("blur", (ev) => this.#toggleEditMode(ev));
      input?.addEventListener("keydown", (ev) => this.#acceptInput(ev));
      input?.addEventListener("input", (ev) => this.#validateInput(ev));
    }

    return this;
  }

  onRemove(map: Map): this {
    super.onRemove(map);

    const element = this.getElement();
    if (element) {
      const text = element.querySelector(".text");
      const button = element.querySelector(".delete");
      const input = element.querySelector(".input");

      // Add click event listener to toggle edit mode
      text?.removeEventListener("mousedown", (ev) => this.#toggleEditMode(ev));
      text?.removeEventListener("mouseup", (ev) => this.#stopEventPropagation(ev));
      text?.removeEventListener("dblclick", (ev) => this.#stopEventPropagation(ev));

      // Add click event listener to delete spot
      button?.removeEventListener("mousedown", (ev) => this.#stopEventPropagation(ev));
      button?.removeEventListener("mouseup", (ev) => this.#stopEventPropagation(ev));
      button?.removeEventListener("dblclick", (ev) => this.#stopEventPropagation(ev));

      // Add click event listener to input spot
      input?.removeEventListener("mousedown", (ev) => this.#stopEventPropagation(ev));
      input?.removeEventListener("mouseup", (ev) => this.#stopEventPropagation(ev));
      input?.removeEventListener("dblclick", (ev) => this.#stopEventPropagation(ev));
      input?.removeEventListener("blur", (ev) => this.#toggleEditMode(ev));
      input?.removeEventListener("keydown", (ev) => this.#acceptInput(ev));
      input?.removeEventListener("input", (ev) => this.#validateInput(ev));
    }

    return this;
  }

  // Method to set the text value
  setTextValue(textValue: string) {
    this.#textValue = textValue;
    const element = this.getElement();
    if (element) {
      const text = element.querySelector(".text");
      if (text) text.textContent = textValue;
    }
  }

  // Method to get the text value
  getTextValue() {
    return this.#textValue;
  }

  // Method to set the rotation angle in radians
  setRotationAngle(angle: number) {
    this.#rotationAngle = angle;
    if (!this.#isEditable) {
      this.#updateRotation();
    }
  }

  // Method to get the rotation angle in radians
  getRotationAngle() {
    return this.#rotationAngle;
  }

  // Method to update the rotation angle to ensure the text is always readable
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

  #toggleEditMode(ev) {
    this.#isEditable = !this.#isEditable;

    ev.stopPropagation();
    ev.preventDefault();

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

  #stopEventPropagation(ev) {
    ev.stopPropagation();
  }

  #validateInput(ev) {
    const element = this.getElement();
    if (element) {
      const input = ev.target as HTMLInputElement;
      const text = element.querySelector(".text");

      // Validate the input value
      const value = input.value;

      // Check if the value is a partial valid input
      const isPartialValid = /^[1]$|^[1][1-7]$|^[1][1-7][1-8]$|^[1][1-7][1-8][1-8]$/.test(value);

      // Check if the value is a complete valid input
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

  #acceptInput(ev) {
    if (ev.key === "Enter") this.#toggleEditMode(ev);
  }
}
