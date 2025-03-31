import { CustomMarker } from "./custommarker";
import { DivIcon, LatLng } from "leaflet";
import { SVGInjector } from "@tanem/svg-injector";
import { getApp } from "../../olympusapp";
import { adjustBrightness, normalizeAngle, rad2deg } from "../../other/utils";
import { SpawnHeadingChangedEvent } from "../../events";
import { RangeCircle } from "../rangecircle";
import { Map } from "../map";
import { colors } from "../../constants/constants";

export class TemporaryUnitMarker extends CustomMarker {
  #name: string;
  #coalition: string;
  #commandHash: string | undefined = undefined;
  #timer: number = 0;
  #headingHandle: boolean;
  #acquisitionCircle: RangeCircle | undefined = undefined;
  #engagementCircle: RangeCircle | undefined = undefined;

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

      if (blueprint.acquisitionRange) {
        this.#acquisitionCircle = new RangeCircle(this.getLatLng(), {
          radius: blueprint.acquisitionRange,
          weight: 2,
          opacity: 1,
          fillOpacity: 0,
          dashArray: "8 12",
          interactive: false,
          bubblingMouseEvents: false,
        });

        switch (this.#coalition) {
          case "red":
            this.#acquisitionCircle.options.color = adjustBrightness(colors.RED_COALITION, -20);
            break;
          case "blue":
            this.#acquisitionCircle.options.color = adjustBrightness(colors.BLUE_COALITION, -20);
            break;
          default:
            this.#acquisitionCircle.options.color = adjustBrightness(colors.NEUTRAL_COALITION, -20);
            break;
        }

        getApp().getMap().addLayer(this.#acquisitionCircle);
      }

      if (blueprint.engagementRange) {
        this.#engagementCircle = new RangeCircle(this.getLatLng(), {
          radius: blueprint.engagementRange,
          weight: 4,
          opacity: 1,
          fillOpacity: 0,
          dashArray: "4 8",
          interactive: false,
          bubblingMouseEvents: false,
        });

        switch (this.#coalition) {
          case "red":
            this.#engagementCircle.options.color = colors.RED_COALITION;
            break;
          case "blue":
            this.#engagementCircle.options.color = colors.BLUE_COALITION
            break;
          default:
            this.#engagementCircle.options.color = colors.NEUTRAL_COALITION;
            break;
        }

        getApp().getMap().addLayer(this.#engagementCircle);
      }

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
      let shortLabel: null | HTMLDivElement = null;
      if (blueprint.category == "aircraft" || blueprint.category == "helicopter") {
        shortLabel = document.createElement("div");
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
          if (shortLabel) shortLabel.style.transform = `rotate(-${heading}deg)`;
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

  onRemove(map: Map): this {
    super.onRemove(map);

    if (this.#acquisitionCircle) map.removeLayer(this.#acquisitionCircle);
    if (this.#engagementCircle) map.removeLayer(this.#engagementCircle);

    return this;
  }
}
