import { SVGInjector } from "@tanem/svg-injector";
import { getApp } from "..";
import { Dropdown } from "../controls/dropdown";
import { Slider } from "../controls/slider";
import { aircraftDatabase } from "../unit/databases/aircraftdatabase";
import { Unit } from "../unit/unit";
import { Panel } from "./panel";
import { Switch } from "../controls/switch";
import { ROEDescriptions, ROEs, altitudeIncrements, emissionsCountermeasures, emissionsCountermeasuresDescriptions, maxAltitudeValues, maxSpeedValues, minAltitudeValues, minSpeedValues, reactionsToThreat, reactionsToThreatDescriptions, shotsIntensityDescriptions, shotsScatterDescriptions, speedIncrements } from "../constants/constants";
import { ftToM, knotsToMs, mToFt, msToKnots } from "../other/utils";
import { GeneralSettings, Radio, TACAN } from "../interfaces";

export class UnitControlPanel extends Panel {
    #altitudeSlider: Slider;
    #tankerSwitch: Switch;
    #AWACSSwitch: Switch;
    #altitudeTypeSwitch: Switch;
    #speedSlider: Slider;
    #speedTypeSwitch: Switch;
    #onOffSwitch: Switch;
    #followRoadsSwitch: Switch;
    #operateAsSwitch: Switch;
    #TACANXYDropdown: Dropdown;
    #radioDecimalsDropdown: Dropdown;
    #radioCallsignDropdown: Dropdown;
    #optionButtons: { [key: string]: HTMLButtonElement[] } = {}
    #advancedSettingsDialog: HTMLElement;
    #units: Unit[] = [];
    #selectedUnitsTypes: string[] = [];

    /**
     * 
     * @param ID - the ID of the HTML element which will contain the context menu
     */
    constructor(ID: string){
        super(ID);

        /* Unit control sliders */
        this.#altitudeSlider = new Slider("altitude-slider", 0, 100, "ft", (value: number) => { getApp().getUnitsManager().selectedUnitsSetAltitude(ftToM(value)); });
        this.#altitudeTypeSwitch = new Switch("altitude-type-switch", (value: boolean) => { getApp().getUnitsManager().selectedUnitsSetAltitudeType(value? "ASL": "AGL"); });

        this.#speedSlider = new Slider("speed-slider", 0, 100, "kts", (value: number) => { getApp().getUnitsManager().selectedUnitsSetSpeed(knotsToMs(value)); });
        this.#speedTypeSwitch = new Switch("speed-type-switch", (value: boolean) => { getApp().getUnitsManager().selectedUnitsSetSpeedType(value? "CAS": "GS"); });

        /* Option buttons */
        // Reversing the ROEs so that the least "aggressive" option is always on the left
        this.#optionButtons["ROE"] = ROEs.slice(0).reverse().map((option: string, index: number) => {
            return this.#createOptionButton(option, `roe/${option.toLowerCase()}.svg`, ROEDescriptions.slice(0).reverse()[index], () => { getApp().getUnitsManager().selectedUnitsSetROE(option); });
        }).filter((button: HTMLButtonElement, index: number) => {return ROEs[index] !== "";});

        this.#optionButtons["reactionToThreat"] = reactionsToThreat.map((option: string, index: number) => {
            return this.#createOptionButton(option, `threat/${option.toLowerCase()}.svg`, reactionsToThreatDescriptions[index],() => { getApp().getUnitsManager().selectedUnitsSetReactionToThreat(option); });
        });

        this.#optionButtons["emissionsCountermeasures"] = emissionsCountermeasures.map((option: string, index: number) => {
            return this.#createOptionButton(option, `emissions/${option.toLowerCase()}.svg`, emissionsCountermeasuresDescriptions[index],() => { getApp().getUnitsManager().selectedUnitsSetEmissionsCountermeasures(option); });
        });

        this.#optionButtons["shotsScatter"] = [1, 2, 3].map((option: number, index: number) => {
            return this.#createOptionButton(option.toString(), `scatter/${option.toString().toLowerCase()}.svg`, shotsScatterDescriptions[index],() => { getApp().getUnitsManager().selectedUnitsSetShotsScatter(option); });
        });

        this.#optionButtons["shotsIntensity"] = [1, 2, 3].map((option: number, index: number) => {
            return this.#createOptionButton(option.toString(), `intensity/${option.toString().toLowerCase()}.svg`, shotsIntensityDescriptions[index],() => { getApp().getUnitsManager().selectedUnitsSetShotsIntensity(option); });
        });

        this.getElement().querySelector("#roe-buttons-container")?.append(...this.#optionButtons["ROE"]);
        this.getElement().querySelector("#reaction-to-threat-buttons-container")?.append(...this.#optionButtons["reactionToThreat"]);
        this.getElement().querySelector("#emissions-countermeasures-buttons-container")?.append(...this.#optionButtons["emissionsCountermeasures"]);
        this.getElement().querySelector("#shots-scatter-buttons-container")?.append(...this.#optionButtons["shotsScatter"]);
        this.getElement().querySelector("#shots-intensity-buttons-container")?.append(...this.#optionButtons["shotsIntensity"]);

        /* Tanker */
        this.#tankerSwitch = new Switch("tanker-on-switch", (value: boolean) => {
            // TODO: split setAdvancedOptions into setIsTanker, setIsAWACS, setAdvancedOptions
            var selectedUnits = getApp().getUnitsManager().getSelectedUnits();
            selectedUnits.forEach((unit: Unit) => {
                unit.setAdvancedOptions(value, unit.getIsActiveAWACS(), unit.getTACAN(), unit.getRadio(), unit.getGeneralSettings());
            });
        });

        /* AWACS */
        this.#AWACSSwitch = new Switch("AWACS-on-switch", (value: boolean) => {
            // TODO: split setAdvancedOptions into setIsTanker, setIsAWACS, setAdvancedOptions
            var selectedUnits = getApp().getUnitsManager().getSelectedUnits();
            selectedUnits.forEach((unit: Unit) => {
                unit.setAdvancedOptions(unit.getIsActiveTanker(), value, unit.getTACAN(), unit.getRadio(), unit.getGeneralSettings());
            });
        });

        /* On off switch */
        this.#onOffSwitch = new Switch("on-off-switch", (value: boolean) => {
            getApp().getUnitsManager().selectedUnitsSetOnOff(value);
        });

        /* Follow roads switch */
        this.#followRoadsSwitch = new Switch("follow-roads-switch", (value: boolean) => {
            getApp().getUnitsManager().selectedUnitsSetFollowRoads(value);
        });

        /* Operate as */
        this.#operateAsSwitch = new Switch("operate-as-switch", (value: boolean) => {
            getApp().getUnitsManager().selectedUnitsSetOperateAs(value);
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

        document.addEventListener("unitsSelection", (e: CustomEvent<Unit[]>) => { 
            this.show(); 
            this.addButtons();
            this.#updateRapidControls();            
        });
        document.addEventListener("clearSelection", () => { 
            this.hide();
            this.#updateRapidControls();  
        });
        document.addEventListener("applyAdvancedSettings", () => {this.#applyAdvancedSettings();})
        document.addEventListener("showAdvancedSettings", () => {
            this.#updateAdvancedSettingsDialog(getApp().getUnitsManager().getSelectedUnits());
            this.#advancedSettingsDialog.classList.remove("hide");
        });
        /*  This is for when a ctrl-click happens on the map for deselection and we need to remove the selected unit from the panel */
        document.addEventListener( "unitsDeselection", ( ev:CustomEventInit ) => {
            this.getElement().querySelector( `button[data-unit-id="${ev.detail.ID}"]` )?.remove();
            this.#updateRapidControls();  
        });

        
        this.hide();
    }

    show() {
        const context = getApp().getCurrentContext();
        if ( !context.getUseUnitControlPanel() )
            return;
        
        super.show();
        this.#speedTypeSwitch.resetExpectedValue();
        this.#altitudeTypeSwitch.resetExpectedValue();
        this.#tankerSwitch.resetExpectedValue();
        this.#AWACSSwitch.resetExpectedValue();
        this.#onOffSwitch.resetExpectedValue();
        this.#followRoadsSwitch.resetExpectedValue();
        this.#altitudeSlider.resetExpectedValue();
        this.#speedSlider.resetExpectedValue();
    }

    addButtons() {
        this.#units = getApp().getUnitsManager().getSelectedUnits();
        this.#selectedUnitsTypes = getApp().getUnitsManager().getSelectedUnitsCategories();
        
        if (this.#units.length < 20) {
            this.getElement().querySelector("#selected-units-container")?.replaceChildren(...this.#units.map((unit: Unit, index: number) => {
                var button = document.createElement("button");
                var callsign = unit.getUnitName() || "";
                var label = unit.getDatabase()?.getByName(unit.getName())?.label || unit.getName();

                button.setAttribute("data-unit-id", "" + unit.ID );
                button.setAttribute("data-label", label);
                button.setAttribute("data-callsign", callsign);

                button.setAttribute("data-coalition", unit.getCoalition());
                button.classList.add("pill", "highlight-coalition")

                button.addEventListener("click", ( ev:MouseEventInit ) => {
                    //  Ctrl-click deselection
                    if ( ev.ctrlKey === true && ev.shiftKey === false && ev.altKey === false ) {
                        getApp().getUnitsManager().deselectUnit( unit.ID );
                        button.remove();
                    //  Deselect all
                    } else {
                        getApp().getUnitsManager().deselectAllUnits();
                        getApp().getUnitsManager().selectUnit(unit.ID, true);
                    }
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
            if (element != null && this.#units.length > 0) {
                /* Toggle visibility of control elements */
                var isTanker = getApp().getUnitsManager().getSelectedUnitsVariable((unit: Unit) => {return unit.isTanker();});
                var isAWACS = getApp().getUnitsManager().getSelectedUnitsVariable((unit: Unit) => {return unit.isAWACS();});
                var isActiveTanker = getApp().getUnitsManager().getSelectedUnitsVariable((unit: Unit) => {return unit.getIsActiveTanker()});
                var isActiveAWACAS = getApp().getUnitsManager().getSelectedUnitsVariable((unit: Unit) => {return unit.getIsActiveAWACS()});

                element.toggleAttribute("data-show-categories-tooltip", this.#selectedUnitsTypes.length > 1);
                element.toggleAttribute("data-show-speed-slider", this.#selectedUnitsTypes.length == 1);
                element.toggleAttribute("data-show-altitude-slider", this.#selectedUnitsTypes.length == 1 && (this.#selectedUnitsTypes.includes("Aircraft") || this.#selectedUnitsTypes.includes("Helicopter")));
                element.toggleAttribute("data-show-roe", !isTanker && !isAWACS);
                element.toggleAttribute("data-show-threat", (this.#selectedUnitsTypes.includes("Aircraft") || this.#selectedUnitsTypes.includes("Helicopter")) && !(this.#selectedUnitsTypes.includes("GroundUnit") || this.#selectedUnitsTypes.includes("NavyUnit")));
                element.toggleAttribute("data-show-emissions-countermeasures", (this.#selectedUnitsTypes.includes("Aircraft") || this.#selectedUnitsTypes.includes("Helicopter")) && !(this.#selectedUnitsTypes.includes("GroundUnit") || this.#selectedUnitsTypes.includes("NavyUnit")));
                element.toggleAttribute("data-show-shots-scatter", this.#selectedUnitsTypes.includes("GroundUnit"));    //TODO: more refined
                element.toggleAttribute("data-show-shots-intensity", this.#selectedUnitsTypes.includes("GroundUnit"));  //TODO: more refined
                element.toggleAttribute("data-show-tanker-button", getApp().getUnitsManager().getSelectedUnitsVariable((unit: Unit) => {return unit.isTanker();}) === true);
                element.toggleAttribute("data-show-AWACS-button", getApp().getUnitsManager().getSelectedUnitsVariable((unit: Unit) => {return unit.isAWACS();}) === true);
                element.toggleAttribute("data-show-on-off", (this.#selectedUnitsTypes.includes("GroundUnit") || this.#selectedUnitsTypes.includes("NavyUnit")) && !(this.#selectedUnitsTypes.includes("Aircraft") || this.#selectedUnitsTypes.includes("Helicopter")));
                element.toggleAttribute("data-show-follow-roads", (this.#selectedUnitsTypes.length == 1 && this.#selectedUnitsTypes.includes("GroundUnit")));
                element.toggleAttribute("data-show-operate-as", getApp().getUnitsManager().getSelectedUnitsVariable((unit: Unit) => {return unit.getCoalition()}) === "neutral");

                if (this.#units.length == 1) {
                    if (isAWACS) 
                        element.toggleAttribute("data-show-advanced-settings-button", isActiveAWACAS);
                    else if (isTanker) 
                        element.toggleAttribute("data-show-advanced-settings-button", isActiveTanker);
                    else 
                        element.toggleAttribute("data-show-advanced-settings-button", true);
                }
                
                if (this.#selectedUnitsTypes.length == 1) {
                    /* Flight controls */
                    var desiredAltitude = getApp().getUnitsManager().getSelectedUnitsVariable((unit: Unit) => {return unit.getDesiredAltitude()});
                    var desiredAltitudeType = getApp().getUnitsManager().getSelectedUnitsVariable((unit: Unit) => {return unit.getDesiredAltitudeType()});
                    var desiredSpeed = getApp().getUnitsManager().getSelectedUnitsVariable((unit: Unit) => {return unit.getDesiredSpeed()});
                    var desiredSpeedType = getApp().getUnitsManager().getSelectedUnitsVariable((unit: Unit) => {return unit.getDesiredSpeedType()});
                    var isActiveTanker = getApp().getUnitsManager().getSelectedUnitsVariable((unit: Unit) => {return unit.getIsActiveTanker()});
                    var isActiveAWACAS = getApp().getUnitsManager().getSelectedUnitsVariable((unit: Unit) => {return unit.getIsActiveAWACS()});
                    var onOff = getApp().getUnitsManager().getSelectedUnitsVariable((unit: Unit) => {return unit.getOnOff()});
                    var followRoads = getApp().getUnitsManager().getSelectedUnitsVariable((unit: Unit) => {return unit.getFollowRoads()});
                    var operateAs = getApp().getUnitsManager().getSelectedUnitsVariable((unit: Unit) => {return unit.getOperateAs()});
                    
                    this.#altitudeTypeSwitch.setValue(desiredAltitudeType != undefined? desiredAltitudeType == "ASL": undefined, false);
                    this.#speedTypeSwitch.setValue(desiredSpeedType != undefined? desiredSpeedType == "CAS": undefined, false);

                    this.#speedSlider.setMinMax(minSpeedValues[this.#selectedUnitsTypes[0]], maxSpeedValues[this.#selectedUnitsTypes[0]]);
                    this.#altitudeSlider.setMinMax(minAltitudeValues[this.#selectedUnitsTypes[0]], maxAltitudeValues[this.#selectedUnitsTypes[0]]);
                    this.#speedSlider.setIncrement(speedIncrements[this.#selectedUnitsTypes[0]]);
                    this.#altitudeSlider.setIncrement(altitudeIncrements[this.#selectedUnitsTypes[0]]);

                    this.#speedSlider.setActive(desiredSpeed != undefined);
                    if (desiredSpeed != undefined)
                        this.#speedSlider.setValue(msToKnots(desiredSpeed), false);

                    this.#altitudeSlider.setActive(desiredAltitude != undefined);
                    if (desiredAltitude != undefined)
                        this.#altitudeSlider.setValue(mToFt(desiredAltitude), false);
                }
                else {
                    this.#speedSlider.setActive(false);
                    this.#altitudeSlider.setActive(false);
                }

                /* Option buttons */
                this.#optionButtons["ROE"].forEach((button: HTMLButtonElement) => {
                    button.classList.toggle("selected", this.#units.every((unit: Unit) => unit.getROE() === button.value))
                });

                this.#optionButtons["reactionToThreat"].forEach((button: HTMLButtonElement) => {
                    button.classList.toggle("selected", this.#units.every((unit: Unit) => unit.getReactionToThreat() === button.value))
                });

                this.#optionButtons["emissionsCountermeasures"].forEach((button: HTMLButtonElement) => {
                    button.classList.toggle("selected", this.#units.every((unit: Unit) => unit.getEmissionsCountermeasures() === button.value))
                });

                this.#optionButtons["shotsScatter"].forEach((button: HTMLButtonElement) => {
                    button.classList.toggle("selected", this.#units.every((unit: Unit) => unit.getShotsScatter().toString() === button.value))
                });

                this.#optionButtons["shotsIntensity"].forEach((button: HTMLButtonElement) => {
                    button.classList.toggle("selected", this.#units.every((unit: Unit) => unit.getShotsIntensity().toString() === button.value))
                });

                this.#tankerSwitch.setValue(isActiveTanker, false);
                this.#AWACSSwitch.setValue(isActiveAWACAS, false);
                this.#onOffSwitch.setValue(onOff, false);
                this.#followRoadsSwitch.setValue(followRoads, false);
                this.#operateAsSwitch.setValue(operateAs? operateAs === "blue": undefined, false);
            }
        }
    }

    #updateRapidControls() {
        var options: { [key: string]: { text: string, tooltip: string, type: string } } | null = null;

        var selectedUnits = getApp().getUnitsManager().getSelectedUnits();

        var showAltitudeChange = selectedUnits.some((unit: Unit) => {return ["Aircraft", "Helicopter"].includes(unit.getCategory());});
        this.getElement().querySelector("#climb")?.classList.toggle("hide", !showAltitudeChange); 
        this.getElement().querySelector("#descend")?.classList.toggle("hide", !showAltitudeChange);

        /* Keep only the common "and" options, unless a single unit is selected */
        selectedUnits.forEach((unit: Unit) => {
            var unitOptions = unit.getActions();
            if (options === null) {
                options = unitOptions;
            } else {
                /* Delete all the "or" type options */
                for (let optionKey in options) {
                    if (options[optionKey].type == "or") {
                        delete options[optionKey];
                    }
                }
            
                /* Options of "and" type get shown if ALL units have it */
                for (let optionKey in options) {
                    if (!(optionKey in unitOptions)) {
                        delete options[optionKey];
                    }
                }
            }
        });

        options = options ?? {};

        const rapidControlsContainer = this.getElement().querySelector("#rapid-controls") as HTMLElement;
        const unitActionButtons = rapidControlsContainer.querySelectorAll(".unit-action-button");
        for (let button of unitActionButtons) {
            rapidControlsContainer.removeChild(button);
        }
    
        for (let option in options) {
            let button = document.createElement("button");
            button.title = options[option].tooltip;
            button.classList.add("ol-button", "unit-action-button");
            button.id = option;
            rapidControlsContainer.appendChild(button);
            button.onclick = () => {
                /* Since only common actions are shown in the rapid controls, we execute it only on the first unit */
                if (selectedUnits.length > 0)
                    selectedUnits[0].executeAction(null, option);
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
            const TACANCheckbox = this.#advancedSettingsDialog.querySelector("#TACAN-checkbox")?.querySelector("input") as HTMLInputElement;
            const TACANChannelInput = this.#advancedSettingsDialog.querySelector("#TACAN-channel")?.querySelector("input") as HTMLInputElement;
            const TACANCallsignInput = this.#advancedSettingsDialog.querySelector("#tacan-callsign")?.querySelector("input") as HTMLInputElement;
            const radioMhzInput = this.#advancedSettingsDialog.querySelector("#radio-mhz")?.querySelector("input") as HTMLInputElement;
            const radioCallsignNumberInput = this.#advancedSettingsDialog.querySelector("#radio-callsign-number")?.querySelector("input") as HTMLInputElement;
           
            const unit = units[0];
            const isTanker = unit.isTanker();
            const isAWACS = unit.isAWACS();
            const radioMHz = Math.floor(unit.getRadio().frequency / 1000000);
            const radioDecimals = (unit.getRadio().frequency / 1000000 - radioMHz) * 1000;

            /* Activate the correct options depending on unit type */
            this.#advancedSettingsDialog.toggleAttribute("data-show-settings", !isTanker && !isAWACS);
            this.#advancedSettingsDialog.toggleAttribute("data-show-air-unit-checkboxes", ["Aircraft", "Helicopter"].includes(units[0].getCategory()));
            this.#advancedSettingsDialog.toggleAttribute("data-show-tasking", isTanker || isAWACS);
            this.#advancedSettingsDialog.toggleAttribute("data-show-tanker", isTanker);
            this.#advancedSettingsDialog.toggleAttribute("data-show-AWACS", isAWACS);
            this.#advancedSettingsDialog.toggleAttribute("data-show-TACAN", isTanker || ["Aircraft Carrier", "Super Aircraft Carrier"].includes(units[0].getType()));
            this.#advancedSettingsDialog.toggleAttribute("data-show-radio", isTanker || isAWACS || ["Aircraft Carrier", "Super Aircraft Carrier"].includes(units[0].getType()));

            /* Set common properties */
            // Name
            unitNameEl.innerText = unit.getUnitName();

            // General settings
            prohibitJettisonCheckbox.checked = unit.getGeneralSettings().prohibitJettison;
            prohibitAfterburnerCheckbox.checked = unit.getGeneralSettings().prohibitAfterburner;
            prohibitAACheckbox.checked = unit.getGeneralSettings().prohibitAA;
            prohibitAGCheckbox.checked = unit.getGeneralSettings().prohibitAG;
            prohibitAirWpnCheckbox.checked = unit.getGeneralSettings().prohibitAirWpn;

            // TACAN
            TACANCheckbox.checked = unit.getTACAN().isOn;
            TACANChannelInput.value = String(unit.getTACAN().channel);
            TACANCallsignInput.value = String(unit.getTACAN().callsign);
            this.#TACANXYDropdown.setValue(unit.getTACAN().XY);

            // Radio
            radioMhzInput.value = String(radioMHz);
            radioCallsignNumberInput.value = String(unit.getRadio().callsignNumber);
            this.#radioDecimalsDropdown.setValue("." + radioDecimals);
                    
            if (isTanker) /* Set tanker specific options */
                this.#radioCallsignDropdown.setOptions(["Texaco", "Arco", "Shell"]);
            else if (isAWACS) /* Set AWACS specific options */
                this.#radioCallsignDropdown.setOptions(["Overlord", "Magic", "Wizard", "Focus", "Darkstar"]);
            else
                this.#radioCallsignDropdown.setOptions(["Enfield", "Springfield", "Uzi", "Colt", "Dodge", "Ford", "Chevy", "Pontiac"]);

            // This must be done after setting the options
            if (!this.#radioCallsignDropdown.selectValue(unit.getRadio().callsign - 1)) // Ensure the selected value is in the acceptable range
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
        const TACANCheckbox = this.#advancedSettingsDialog.querySelector("#TACAN-checkbox")?.querySelector("input") as HTMLInputElement;
        const TACANChannelInput = this.#advancedSettingsDialog.querySelector("#TACAN-channel")?.querySelector("input") as HTMLInputElement;
        const TACANCallsignInput = this.#advancedSettingsDialog.querySelector("#tacan-callsign")?.querySelector("input") as HTMLInputElement;
        const radioMhzInput = this.#advancedSettingsDialog.querySelector("#radio-mhz")?.querySelector("input") as HTMLInputElement;
        const radioCallsignNumberInput = this.#advancedSettingsDialog.querySelector("#radio-callsign-number")?.querySelector("input") as HTMLInputElement;


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
        var units = getApp().getUnitsManager().getSelectedUnits();
        // TODO: split setAdvancedOptions into setIsTanker, setIsAWACS, setAdvancedOptions
        if (units.length > 0)
            units[0].setAdvancedOptions(units[0].getIsActiveTanker(), units[0].getIsActiveAWACS(), TACAN, radio, generalSettings);

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