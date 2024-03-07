import { deg2rad, rad2deg, zeroAppend } from "../other/utils";

export class NumericInput {
    #bugContainer!: HTMLElement;
    #container: HTMLElement;
    #input: HTMLInputElement;
    #callback: (value: number) => void;
    #defaultText: string;
    #hidden: boolean = false;

    constructor(ID: string | null, callback: (value: number) => void, defaultValue?: number, defaultText: string = "SpawnHeading") {
        this.#container = document.createElement("div");
        this.#container.className = "spawn-heading";

        this.#input = document.createElement("input");
        this.#input.type = "number";
        this.#input.min = "0";
        this.#input.max = "360";
        this.#input.value = defaultValue?.toString() ?? "";
        this.#defaultText = defaultText; // Might be used for placeholder or label if needed

        this.#callback = callback;

        this.#container.appendChild(this.#input);
        if (ID) {
            this.#container.id = ID;
        }

        this.#addBug();

        this.#input.addEventListener("change", this.#handleChange.bind(this));
        this.#container.addEventListener("wheel", this.#handleWheel.bind(this));
    }

    #addBug() {
        const bugContainer = document.createElement("div");
        bugContainer.className = "bug-container";

        const bug = document.createElement("div");
        bug.className = "bug";

        bugContainer.appendChild(bug);
        this.#container.insertBefore(bugContainer, this.#container.firstChild);

        this.#bugContainer = bugContainer;

        let bugIsBeingSet = false;

        const rotateBug = (ev: MouseEvent) => {
            if (!bugIsBeingSet) return;
            const centre = this.#getContainerCentrepoint();
            const mousePosition = {
                x: ev.pageX,
                y: ev.pageY
            };
            const dx = mousePosition.x - centre.x;
            const dy = mousePosition.y - centre.y;

            let angle = Math.atan2(dy, dx) - deg2rad(-90);
            if (angle < 0) angle += Math.PI * 2;

            const degrees = Math.floor(rad2deg(angle));
            this.setValue(degrees);
        }
        bug.addEventListener("mousedown", (ev: MouseEvent) => bugIsBeingSet = true);
        document.addEventListener("mouseup", (ev: MouseEvent) => bugIsBeingSet = false);
        document.addEventListener("mousemove", rotateBug)
    }

    #handleChange() {
        const value = parseInt(this.#input.value, 10);
        this.#input.value = zeroAppend(value, 3);
        if (!isNaN(value) && value >= 0 && value <= 360) {
            const radians = deg2rad(value);
            this.#updateBugPosition(value)
            this.#callback(radians);
        }
    }

    #handleWheel(event: WheelEvent) {
        event.preventDefault();
        let currentValue = parseInt(this.#input.value, 10);
        if (!isNaN(currentValue)) {
            currentValue += event.deltaY < 0 ? 1 : -1;
            this.setValue(currentValue)
        }
    }

    #getContainerCentrepoint(): { x: number, y: number } {
        const rect = this.#container.getBoundingClientRect();
        return {
            x: rect.x + (rect.width / 2),
            y: rect.y + (rect.height / 2)
        };
    }

    getContainer(): HTMLElement {
        return this.#container;
    }

    getValue(): number {
        const value = parseInt(this.#input.value, 10);
        return !isNaN(value) ? value : 0;
    }

    setValue(value: number): void {
        if (value > 360) value -= 360;
        if (value < 1) value += 360;
        this.#input.value = zeroAppend(value, 3);
        this.#handleChange();
    }

    show() {
        this.#container.classList.remove("hide");
        this.#hidden = false;
    }

    isHidden() {
        return this.#hidden;
    }

    #updateBugPosition(degrees: number) {
        this.#bugContainer.style.transform = `rotate(${degrees}deg)`;
    }
}
