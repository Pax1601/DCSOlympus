import { SVGInjector } from "@tanem/svg-injector";
import { getUnitsManager } from "..";
import { Dropdown } from "../controls/dropdown";
import { Slider } from "../controls/slider";
import { aircraftDatabase } from "../units/aircraftdatabase";
import { Unit } from "../units/unit";
import { Panel } from "./panel";
import { Switch } from "../controls/switch";
import { ROEDescriptions, ROEs, altitudeIncrements, emissionsCountermeasures, emissionsCountermeasuresDescriptions, maxAltitudeValues, maxSpeedValues, minAltitudeValues, minSpeedValues, reactionsToThreat, reactionsToThreatDescriptions, speedIncrements } from "../constants/constants";
import { ftToM, knotsToMs, mToFt, msToKnots } from "../other/utils";

export class UnitControlPanel extends Panel {
    #altitudeSlider: Slider;
    #altitudeTypeSwitch: Switch;
    #speedSlider: Slider;
    #speedTypeSwitch: Switch;
    #onOffSwitch: Switch;
    #followRoadsSwitch: Switch;
    #TACANXYDropdown: Dropdown;
    #radioDecimalsDropdown: Dropdown;
    #radioCallsignDropdown: Dropdown;
    #optionButtons: { [key: string]: HTMLButtonElement[] } = {}
    #advancedSettingsDialog: HTMLElement;

    constructor(ID: string) {
        super(ID);

        /* Unit control sliders */
        this.#altitudeSlider = new Slider("altitude-slider", 0, 100, "ft", (value: number) => { getUnitsManager().selectedUnitsSetAltitude(ftToM(value)); });
        this.#altitudeTypeSwitch = new Switch("altitude-type-switch", (value: boolean) => { getUnitsManager().selectedUnitsSetAltitudeType(value? "AGL": "ASL"); });

        this.#speedSlider = new Slider("speed-slider", 0, 100, "kts", (value: number) => { getUnitsManager().selectedUnitsSetSpeed(knotsToMs(value)); });
        this.#speedTypeSwitch = new Switch("speed-type-switch", (value: boolean) => { getUnitsManager().selectedUnitsSetSpeedType(value? "GS": "CAS"); });

        /* Option buttons */
        this.#optionButtons["ROE"] = ROEs.map((option: string, index: number) => {
            return this.#createOptionButton(option, `roe/${option.toLowerCase()}.svg`, ROEDescriptions[index], () => { getUnitsManager().selectedUnitsSetROE(option); });
        });

        this.#optionButtons["reactionToThreat"] = reactionsToThreat.map((option: string, index: number) => {
            return this.#createOptionButton(option, `threat/${option.toLowerCase()}.svg`, reactionsToThreatDescriptions[index],() => { getUnitsManager().selectedUnitsSetReactionToThreat(option); });
        });

        this.#optionButtons["emissionsCountermeasures"] = emissionsCountermeasures.map((option: string, index: number) => {
            return this.#createOptionButton(option, `emissions/${option.toLowerCase()}.svg`, emissionsCountermeasuresDescriptions[index],() => { getUnitsManager().selectedUnitsSetEmissionsCountermeasures(option); });
        });

        this.getElement().querySelector("#roe-buttons-container")?.append(...this.#optionButtons["ROE"]);
        this.getElement().querySelector("#reaction-to-threat-buttons-container")?.append(...this.#optionButtons["reactionToThreat"]);
        this.getElement().querySelector("#emissions-countermeasures-buttons-container")?.append(...this.#optionButtons["emissionsCountermeasures"]);

        /* On off switch */
        this.#onOffSwitch = new Switch("on-off-switch", (value: boolean) => {
            getUnitsManager().selectedUnitsSetOnOff(value);
        });

        /* Follow roads switch */
        this.#followRoadsSwitch = new Switch("follow-roads-switch", (value: boolean) => {
            getUnitsManager().selectedUnitsSetFollowRoads(value);
        });

        /* Advanced settings dialog */
        this.#advancedSettingsDialog = <HTMLElement> document.querySelector("#advanced-settings-dialog");

        /* Advanced settings dropdowns */
        this.#TACANXYDropdown = new Dropdown("TACAN-XY", () => {});
        this.#TACANXYDropdown.setOptions(["X", "Y"]);
        this.#radioDecimalsDropdown = new Dropdown("radio-decimals", () => {});
        this.#radioDecimalsDropdown.setOptions([".000", ".250", ".500", ".750"]);
        this.#radioCallsignDropdown = new Dropdown("radio-callsign", () => {});

        /* Events and timer */
        window.setInterval(() => {this.update();}, 25);

        document.addEventListener("unitsSelection", (e: CustomEvent<Unit[]>) => { this.show(); this.addButtons();});
        document.addEventListener("clearSelection", () => { this.hide() });
        document.addEventListener("applyAdvancedSettings", () => {this.#applyAdvancedSettings();})
        document.addEventListener("showAdvancedSettings", () => {
            this.#updateAdvancedSettingsDialog(getUnitsManager().getSelectedUnits());
            this.#advancedSettingsDialog.classList.remove("hide");
        });

        this.hide();
    }

    show() {
        super.show();
        this.#speedTypeSwitch.resetExpectedValue();
        this.#altitudeTypeSwitch.resetExpectedValue();
        this.#onOffSwitch.resetExpectedValue();
        this.#followRoadsSwitch.resetExpectedValue();
        this.#altitudeSlider.resetExpectedValue();
        this.#speedSlider.resetExpectedValue();
    }

    addButtons() {
        var units = getUnitsManager().getSelectedUnits();
        if (units.length < 20) {
            this.getElement().querySelector("#selected-units-container")?.replaceChildren(...units.map((unit: Unit, index: number) => {
                var button = document.createElement("button");
                var callsign = unit.getBaseData().unitName || "";
                var label = unit.getDatabase()?.getByName(unit.getBaseData().name)?.label || unit.getBaseData().name;

                button.setAttribute("data-label", label);
                button.setAttribute("data-callsign", callsign);

                button.setAttribute("data-coalition", unit.getMissionData().coalition);
                button.classList.add("pill", "highlight-coalition")

                button.addEventListener("click", () => {
                    getUnitsManager().deselectAllUnits();
                    getUnitsManager().selectUnit(unit.ID, true);
                });
                return (button);
            }));
        } else {
            var el = document.createElement("div");
            el.innerText = "Too many units selected";
            this.getElement().querySelector("#selected-units-container")?.replaceChildren(el);
        }
    }

    update() {
        if (this.getVisible()){
            const element = this.getElement();
            const units = getUnitsManager().getSelectedUnits();
            const selectedUnitsTypes = getUnitsManager().getSelectedUnitsTypes();
                
            if (element != null && units.length > 0) {
                /* Toggle visibility of control elements */
                element.toggleAttribute("data-show-categories-tooltip", selectedUnitsTypes.length > 1);
                element.toggleAttribute("data-show-speed-slider", selectedUnitsTypes.length == 1);
                element.toggleAttribute("data-show-altitude-slider", selectedUnitsTypes.length == 1 && (selectedUnitsTypes.includes("Aircraft") || selectedUnitsTypes.includes("Helicopter")));
                element.toggleAttribute("data-show-roe", true);
                element.toggleAttribute("data-show-threat", (selectedUnitsTypes.includes("Aircraft") || selectedUnitsTypes.includes("Helicopter")) && !(selectedUnitsTypes.includes("GroundUnit") || selectedUnitsTypes.includes("NavyUnit")));
                element.toggleAttribute("data-show-emissions-countermeasures", (selectedUnitsTypes.includes("Aircraft") || selectedUnitsTypes.includes("Helicopter")) && !(selectedUnitsTypes.includes("GroundUnit") || selectedUnitsTypes.includes("NavyUnit")));
                element.toggleAttribute("data-show-on-off", (selectedUnitsTypes.includes("GroundUnit") || selectedUnitsTypes.includes("NavyUnit")) && !(selectedUnitsTypes.includes("Aircraft") || selectedUnitsTypes.includes("Helicopter")));
                element.toggleAttribute("data-show-follow-roads", (selectedUnitsTypes.length == 1 && selectedUnitsTypes.includes("GroundUnit")));
                element.toggleAttribute("data-show-advanced-settings-button", units.length == 1);
                
                /* Flight controls */
                var targetAltitude: number | undefined = getUnitsManager().getSelectedUnitsVariable((unit: Unit) => {return unit.getTaskData().targetAltitude});
                var targetAltitudeType = getUnitsManager().getSelectedUnitsVariable((unit: Unit) => {return unit.getTaskData().targetAltitudeType});
                var targetSpeed = getUnitsManager().getSelectedUnitsVariable((unit: Unit) => {return unit.getTaskData().targetSpeed});
                var targetSpeedType = getUnitsManager().getSelectedUnitsVariable((unit: Unit) => {return unit.getTaskData().targetSpeedType});
                var onOff = getUnitsManager().getSelectedUnitsVariable((unit: Unit) => {return unit.getTaskData().onOff});
                var followRoads = getUnitsManager().getSelectedUnitsVariable((unit: Unit) => {return unit.getTaskData().followRoads});

                if (selectedUnitsTypes.length == 1) {
                    this.#altitudeTypeSwitch.setValue(targetAltitudeType != undefined? targetAltitudeType == "AGL": undefined, false);
                    this.#speedTypeSwitch.setValue(targetSpeedType != undefined? targetSpeedType == "GS": undefined, false);

                    this.#speedSlider.setMinMax(minSpeedValues[selectedUnitsTypes[0]], maxSpeedValues[selectedUnitsTypes[0]]);
                    this.#altitudeSlider.setMinMax(minAltitudeValues[selectedUnitsTypes[0]], maxAltitudeValues[selectedUnitsTypes[0]]);
                    this.#speedSlider.setIncrement(speedIncrements[selectedUnitsTypes[0]]);
                    this.#altitudeSlider.setIncrement(altitudeIncrements[selectedUnitsTypes[0]]);

                    this.#speedSlider.setActive(targetSpeed != undefined);
                    if (targetSpeed != undefined)
                        this.#speedSlider.setValue(msToKnots(targetSpeed), false);

                    this.#altitudeSlider.setActive(targetAltitude != undefined);
                    if (targetAltitude != undefined)
                        this.#altitudeSlider.setValue(mToFt(targetAltitude), false);
                }
                else {
                    this.#speedSlider.setActive(false);
                    this.#altitudeSlider.setActive(false);
                }

                /* Option buttons */
                this.#optionButtons["ROE"].forEach((button: HTMLButtonElement) => {
                    button.classList.toggle("selected", units.every((unit: Unit) => unit.getOptionsData().ROE === button.value))
                });

                this.#optionButtons["reactionToThreat"].forEach((button: HTMLButtonElement) => {
                    button.classList.toggle("selected", units.every((unit: Unit) => unit.getOptionsData().reactionToThreat === button.value))
                });

                this.#optionButtons["emissionsCountermeasures"].forEach((button: HTMLButtonElement) => {
                    button.classList.toggle("selected", units.every((unit: Unit) => unit.getOptionsData().emissionsCountermeasures === button.value))
                });

                this.#onOffSwitch.setValue(onOff, false);
                this.#followRoadsSwitch.setValue(followRoads, false);
            }
        }
    }

    #updateAdvancedSettingsDialog(units: Unit[])
    {
        if (units.length == 1)
        {
            /* HTML Elements */
            const unitNameEl = this.#advancedSettingsDialog.querySelector("#unit-name") as HTMLElement;
            const prohibitJettisonCheckbox = this.#advancedSettingsDialog.querySelector("#prohibit-jettison-checkbox")?.querySelector("input") as HTMLInputElement;
            const prohibitAfterburnerCheckbox = this.#advancedSettingsDialog.querySelector("#prohibit-afterburner-checkbox")?.querySelector("input") as HTMLInputElement;
            const prohibitAACheckbox = this.#advancedSettingsDialog.querySelector("#prohibit-AA-checkbox")?.querySelector("input") as HTMLInputElement;
            const prohibitAGCheckbox = this.#advancedSettingsDialog.querySelector("#prohibit-AG-checkbox")?.querySelector("input") as HTMLInputElement;
            const prohibitAirWpnCheckbox = this.#advancedSettingsDialog.querySelector("#prohibit-air-wpn-checkbox")?.querySelector("input") as HTMLInputElement;
            const tankerCheckbox = this.#advancedSettingsDialog.querySelector("#tanker-checkbox")?.querySelector("input") as HTMLInputElement;
            const AWACSCheckbox = this.#advancedSettingsDialog.querySelector("#AWACS-checkbox")?.querySelector("input") as HTMLInputElement;
            const TACANCheckbox = this.#advancedSettingsDialog.querySelector("#TACAN-checkbox")?.querySelector("input") as HTMLInputElement;
            const TACANChannelInput = this.#advancedSettingsDialog.querySelector("#TACAN-channel")?.querySelector("input") as HTMLInputElement;
            const TACANCallsignInput = this.#advancedSettingsDialog.querySelector("#tacan-callsign")?.querySelector("input") as HTMLInputElement;
            const radioMhzInput = this.#advancedSettingsDialog.querySelector("#radio-mhz")?.querySelector("input") as HTMLInputElement;
            const radioCallsignNumberInput = this.#advancedSettingsDialog.querySelector("#radio-callsign-number")?.querySelector("input") as HTMLInputElement;
            
            const unit = units[0];
            const roles = aircraftDatabase.getByName(unit.getBaseData().name)?.loadouts.map((loadout) => {return loadout.roles})
            const tanker = roles != undefined && Array.prototype.concat.apply([], roles)?.includes("Tanker");
            const AWACS = roles != undefined && Array.prototype.concat.apply([], roles)?.includes("AWACS");
            const radioMHz = Math.floor(unit.getOptionsData().radio.frequency / 1000000);
            const radioDecimals = (unit.getOptionsData().radio.frequency / 1000000 - radioMHz) * 1000;

            /* Activate the correct options depending on unit type */
            this.#advancedSettingsDialog.toggleAttribute("data-show-settings", !tanker && !AWACS);
            this.#advancedSettingsDialog.toggleAttribute("data-show-tasking", tanker || AWACS);
            this.#advancedSettingsDialog.toggleAttribute("data-show-tanker", tanker);
            this.#advancedSettingsDialog.toggleAttribute("data-show-AWACS", AWACS);
            this.#advancedSettingsDialog.toggleAttribute("data-show-TACAN", tanker);
            this.#advancedSettingsDialog.toggleAttribute("data-show-radio", tanker || AWACS);

            /* Set common properties */
            // Name
            unitNameEl.innerText = unit.getBaseData().unitName;

            // General settings
            prohibitJettisonCheckbox.checked = unit.getOptionsData().generalSettings.prohibitJettison;
            prohibitAfterburnerCheckbox.checked = unit.getOptionsData().generalSettings.prohibitAfterburner;
            prohibitAACheckbox.checked = unit.getOptionsData().generalSettings.prohibitAA;
            prohibitAGCheckbox.checked = unit.getOptionsData().generalSettings.prohibitAG;
            prohibitAirWpnCheckbox.checked = unit.getOptionsData().generalSettings.prohibitAirWpn;

            // Tasking
            tankerCheckbox.checked = unit.getTaskData().isTanker;
            AWACSCheckbox.checked = unit.getTaskData().isAWACS;

            // TACAN
            TACANCheckbox.checked = unit.getOptionsData().TACAN.isOn;
            TACANChannelInput.value = String(unit.getOptionsData().TACAN.channel);
            TACANCallsignInput.value = String(unit.getOptionsData().TACAN.callsign);
            this.#TACANXYDropdown.setValue(unit.getOptionsData().TACAN.XY);

            // Radio
            radioMhzInput.value = String(radioMHz);
            radioCallsignNumberInput.value = String(unit.getOptionsData().radio.callsignNumber);
            this.#radioDecimalsDropdown.setValue("." + radioDecimals);
                    
            if (tanker) /* Set tanker specific options */
                this.#radioCallsignDropdown.setOptions(["Texaco", "Arco", "Shell"]);
            else if (AWACS) /* Set AWACS specific options */
                this.#radioCallsignDropdown.setOptions(["Overlord", "Magic", "Wizard", "Focus", "Darkstar"]);
            else
                this.#radioCallsignDropdown.setOptions(["Enfield", "Springfield", "Uzi", "Colt", "Dodge", "Ford", "Chevy", "Pontiac"]);

            // This must be done after setting the options
            if (!this.#radioCallsignDropdown.selectValue(unit.getOptionsData().radio.callsign - 1)) // Ensure the selected value is in the acceptable range
                this.#radioCallsignDropdown.selectValue(0);
        }
    }

    #applyAdvancedSettings()
    {
        /* HTML Elements */
        const prohibitJettisonCheckbox = this.#advancedSettingsDialog.querySelector("#prohibit-jettison-checkbox")?.querySelector("input") as HTMLInputElement;
        const prohibitAfterburnerCheckbox = this.#advancedSettingsDialog.querySelector("#prohibit-afterburner-checkbox")?.querySelector("input") as HTMLInputElement;
        const prohibitAACheckbox = this.#advancedSettingsDialog.querySelector("#prohibit-AA-checkbox")?.querySelector("input") as HTMLInputElement;
        const prohibitAGCheckbox = this.#advancedSettingsDialog.querySelector("#prohibit-AG-checkbox")?.querySelector("input") as HTMLInputElement;
        const prohibitAirWpnCheckbox = this.#advancedSettingsDialog.querySelector("#prohibit-air-wpn-checkbox")?.querySelector("input") as HTMLInputElement;
        const tankerCheckbox = this.#advancedSettingsDialog.querySelector("#tanker-checkbox")?.querySelector("input") as HTMLInputElement;
        const AWACSCheckbox = this.#advancedSettingsDialog.querySelector("#AWACS-checkbox")?.querySelector("input") as HTMLInputElement;
        const TACANCheckbox = this.#advancedSettingsDialog.querySelector("#TACAN-checkbox")?.querySelector("input") as HTMLInputElement;
        const TACANChannelInput = this.#advancedSettingsDialog.querySelector("#TACAN-channel")?.querySelector("input") as HTMLInputElement;
        const TACANCallsignInput = this.#advancedSettingsDialog.querySelector("#tacan-callsign")?.querySelector("input") as HTMLInputElement;
        const radioMhzInput = this.#advancedSettingsDialog.querySelector("#radio-mhz")?.querySelector("input") as HTMLInputElement;
        const radioCallsignNumberInput = this.#advancedSettingsDialog.querySelector("#radio-callsign-number")?.querySelector("input") as HTMLInputElement;

        /* Tasking */
        const isTanker = tankerCheckbox.checked? true: false;
        const isAWACS = AWACSCheckbox.checked? true: false;

        /* TACAN */
        const TACAN: TACAN = {
            isOn: TACANCheckbox.checked? true: false,
            channel: Number(TACANChannelInput.value),
            XY: this.#TACANXYDropdown.getValue(),
            callsign: TACANCallsignInput.value as string
        }

        /* Radio */
        const radioMHz = Number(radioMhzInput.value);
        const radioDecimals = this.#radioDecimalsDropdown.getValue();
        const radio: Radio = {
            frequency: (radioMHz * 1000 + Number(radioDecimals.substring(1))) * 1000,
            callsign: this.#radioCallsignDropdown.getIndex() + 1,
            callsignNumber:  Number(radioCallsignNumberInput.value)
        }

        /* General settings */
        const generalSettings: GeneralSettings = {
            prohibitJettison: prohibitJettisonCheckbox.checked? true: false,
            prohibitAfterburner: prohibitAfterburnerCheckbox.checked? true: false,
            prohibitAA: prohibitAACheckbox.checked? true: false,
            prohibitAG: prohibitAGCheckbox.checked? true: false,
            prohibitAirWpn: prohibitAirWpnCheckbox.checked? true: false
        }
        
        /* Send command and close */
        var units = getUnitsManager().getSelectedUnits();
        if (units.length > 0)
            units[0].setAdvancedOptions(isTanker, isAWACS, TACAN, radio, generalSettings);

        this.#advancedSettingsDialog.classList.add("hide");
    }

    #createOptionButton(value: string, url: string, title: string, callback: EventListenerOrEventListenerObject) {
        var button = document.createElement("button");
        button.title = title;
        button.value = value;
        var img = document.createElement("img");
        img.src = `/resources/theme/images/buttons/${url}`;
        img.onload = () => SVGInjector(img);
        button.appendChild(img);
        button.addEventListener("click", callback);
        return button;
    }
}