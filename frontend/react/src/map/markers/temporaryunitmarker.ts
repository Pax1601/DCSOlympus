import { CustomMarker } from "./custommarker";
import { DivIcon, LatLng } from "leaflet";
import { SVGInjector } from "@tanem/svg-injector";
import { getApp } from "../../olympusapp";
import { UnitBlueprint } from "../../interfaces";
import { deg2rad, normalizeAngle, rad2deg } from "../../other/utils";
import { SpawnHeadingChangedEvent } from "../../events";

export class TemporaryUnitMarker extends CustomMarker {
  #name: string;
  #coalition: string;
  #commandHash: string | undefined = undefined;
  #timer: number = 0;
  #headingHandle: boolean;

  constructor(latlng: LatLng, name: string, coalition: string, headingHandle: boolean, commandHash?: string) {
    super(latlng, { interactive: false });
    this.#name = name;
    this.#coalition = coalition;
    this.#commandHash = commandHash;
    this.#headingHandle = headingHandle;

    if (commandHash !== undefined) this.setCommandHash(commandHash);
  }

  setCommandHash(commandHash: string) {
    this.#commandHash = commandHash;
    this.#timer = window.setInterval(() => {
      if (this.#commandHash !== undefined) {
        getApp()
          .getServerManager()
          .isCommandExecuted((res: any) => {
            if (res.commandExecuted) {
              this.removeFrom(getApp().getMap());
              window.clearInterval(this.#timer);
            }
          }, this.#commandHash);
      }
    }, 1000);
  }

  createIcon() {
    const blueprint = getApp().getUnitsManager().getDatabase().getByName(this.#name);

    if (blueprint) {
      /* Set the icon */
      var icon = new DivIcon({
        className: "leaflet-unit-icon",
        iconAnchor: [25, 25],
        iconSize: [50, 50],
      });
      this.setIcon(icon);

      var el = document.createElement("div");
      el.classList.add("unit");
      el.setAttribute("data-object", `unit-${blueprint.category}`);
      el.setAttribute("data-coalition", this.#coalition);

      // Main icon
      var unitIcon = document.createElement("div");
      unitIcon.classList.add("unit-icon");
      var img = document.createElement("img");
      img.src = `images/units/map/${/*TODO getApp().getMap().getOptions().AWACSMode ? "awacs" :*/ "normal"}/${this.#coalition}/${blueprint.markerFile ?? blueprint.category}.svg`;
      img.onload = () => SVGInjector(img);
      unitIcon.appendChild(img);
      unitIcon.toggleAttribute("data-rotate-to-heading", false);
      el.append(unitIcon);

      // Short label
      if (blueprint.category == "aircraft" || blueprint.category == "helicopter") {
        var shortLabel = document.createElement("div");
        shortLabel.classList.add("unit-short-label");
        shortLabel.innerText = blueprint?.shortLabel || "";
        el.append(shortLabel);
      }

      // Heading handle
      if (this.#headingHandle) {
        var handle = document.createElement("div");
        var handleImg = document.createElement("img");
        handleImg.src = "images/others/arrow.svg";
        handleImg.onload = () => SVGInjector(handleImg);
        handle.classList.add("heading-handle");
        el.append(handle);

        handle.append(handleImg);

        const rotateHandle = (heading) => {
          el.style.transform = `rotate(${heading}deg)`;
          unitIcon.style.transform = `rotate(-${heading}deg)`;
          shortLabel.style.transform = `rotate(-${heading}deg)`;
        };

        SpawnHeadingChangedEvent.on((heading) => rotateHandle(heading));
        rotateHandle(getApp().getMap().getSpawnHeading());

        // Add drag and rotate functionality
        handle.addEventListener("mousedown", (e) => {
          e.preventDefault();
          e.stopPropagation();

          const onMouseMove = (e) => {
            const rect = el.getBoundingClientRect();
            const centerX = rect.left + rect.width / 2;
            const centerY = rect.top + rect.height / 2;
            let angle = rad2deg(Math.atan2(e.clientY - centerY, e.clientX - centerX)) + 90;
            angle = normalizeAngle(angle);
            getApp().getMap().setSpawnHeading(angle);
          };

          const onMouseUp = () => {
            document.removeEventListener("mousemove", onMouseMove);
            document.removeEventListener("mouseup", onMouseUp);
          };

          document.addEventListener("mousemove", onMouseMove);
          document.addEventListener("mouseup", onMouseUp);
        });
      }

      this.getElement()?.appendChild(el);
      this.getElement()?.classList.add("ol-temporary-marker");
    }
  }
}
