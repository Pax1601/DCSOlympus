import { LatLng } from "leaflet";
import { Dropdown } from "./dropdown";
import { Slider } from "./slider";
import { UnitDatabase } from "../unit/unitdatabase";
import { getActiveCoalition, getMap, getMissionHandler, getUnitsManager } from "..";
import { GAME_MASTER } from "../constants/constants";
import { UnitSpawnOptions } from "../@types/unitdatabase";
import { Airbase } from "../mission/airbase";

export class UnitSpawnMenu {
    #unitRoleTypeDropdown: Dropdown;
    #unitLabelDropdown: Dropdown;
    #unitCountDropdown: Dropdown;
    #unitLoadoutDropdown: Dropdown | null = null;
    #unitCountryDropdown: Dropdown;
    #unitLiveryDropdown: Dropdown;
    //#unitSpawnAltitudeSlider: Slider;

    #unitRoleTypeDropdownEl: HTMLDivElement;
    #unitLabelDropdownEl: HTMLDivElement;
    #unitLoadoutDropdownEl: HTMLDivElement | null = null;
    #unitCountDropdownEl: HTMLDivElement;
    #unitCountryDropdownEl: HTMLDivElement;
    #unitLiveryDropdownEl: HTMLDivElement;
    #deployUnitButtonEl: HTMLButtonElement;
    #unitLoadoutPreviewEl: HTMLDivElement | null = null;
    #unitImageEl: HTMLImageElement | null = null;
    #unitLoadoutListEl: HTMLDivElement | null = null;

    #container: HTMLElement;
    #options = {orderByRole: true, maxUnitCount: 4, showLoadout: true, showAltitudeSlider: true};
    #spawnOptions: UnitSpawnOptions = { roleType: "", name: "", latlng: new LatLng(0, 0), coalition: "blue", count: 1, country: "", loadout: undefined, airbase: undefined, liveryID: undefined, altitude: undefined };
    #unitDatabase: UnitDatabase;
    #countryCodes: any;

    constructor(id: string, unitDatabase: UnitDatabase, options?: {orderByRole: boolean, maxUnitCount: number, showLoadout: boolean, showAltitudeSlider: boolean}) {
        this.#container = document.getElementById(id) as HTMLElement;
        this.#unitDatabase = unitDatabase;

        if (options !== undefined)
            this.#options = options;

        /* Create the HTML elements for the dropdowns */
        if (this.#options.orderByRole)
            this.#unitRoleTypeDropdownEl = this.#addDropdown("Unit role");
        else
            this.#unitRoleTypeDropdownEl = this.#addDropdown("Unit type");
        this.#unitLabelDropdownEl = this.#addDropdown("Unit label");
        if (this.#options.showLoadout)
            this.#unitLoadoutDropdownEl = this.#addDropdown("Unit loadout");
        this.#unitCountDropdownEl = this.#addDropdown("Unit count");
        this.#unitCountryDropdownEl = this.#addDropdown("Unit country");
        this.#unitLiveryDropdownEl = this.#addDropdown("Unit livery");

        var unitLabelCountContainerEl = document.createElement("div");
        unitLabelCountContainerEl.classList.add("unit-label-count-container");
        var divider = document.createElement("div");
        divider.innerText = "x";
        unitLabelCountContainerEl.append(this.#unitLabelDropdownEl, divider, this.#unitCountDropdownEl);

        /* Create the dropdowns and the altitude slider */
        this.#unitRoleTypeDropdown = new Dropdown(this.#unitRoleTypeDropdownEl, (roleType: string) => this.#setUnitRoleType(roleType));
        this.#unitLabelDropdown = new Dropdown(this.#unitLabelDropdownEl, (label: string) => this.#setUnitLabel(label));
        if (this.#unitLoadoutDropdownEl !== null)
            this.#unitLoadoutDropdown = new Dropdown(this.#unitLoadoutDropdownEl, (loadout: string) => this.#setUnitLoadout(loadout)); 
        this.#unitCountDropdown = new Dropdown(this.#unitCountDropdownEl, (count: string) => this.#setUnitCount(count));
        this.#unitCountryDropdown = new Dropdown(this.#unitCountryDropdownEl, () => { /* Custom button implementation */ });
        this.#unitLiveryDropdown = new Dropdown(this.#unitLiveryDropdownEl, (livery: string) => this.#setUnitLivery(livery));
        //this.#unitSpawnAltitudeSlider = new Slider("unit-spawn-altitude-slider", 0, 50000, "ft", (value: number) => {this.#spawnOptions.altitude = ftToM(value);});
        
        var countOptions: string[] = [];
        for (let i = 1; i <= this.#options.maxUnitCount; i++) 
            countOptions.push(i.toString());
        this.#unitCountDropdown.setOptions(countOptions);
        this.#unitCountDropdown.selectValue(0);
        
        //this.#unitSpawnAltitudeSlider.setIncrement(500);
        //this.#unitSpawnAltitudeSlider.setValue(20000);
        //this.#unitSpawnAltitudeSlider.setActive(true);

        /* Create the unit image and loadout elements */
        if (this.#options.showLoadout) {
            this.#unitLoadoutPreviewEl = document.createElement("div");
            this.#unitLoadoutPreviewEl.classList.add("unit-loadout-preview");
            this.#unitImageEl = document.createElement("img");
            this.#unitImageEl.classList.add("unit-image", "hide");
            this.#unitLoadoutListEl = document.createElement("div");
            this.#unitLoadoutListEl.classList.add("unit-loadout-list");
            this.#unitLoadoutPreviewEl.append(this.#unitImageEl, this.#unitLoadoutListEl);
        }

        /* Create the divider and the advanced options collapsible div */
        var advancedOptionsDiv = document.createElement("div");
        advancedOptionsDiv.classList.add("contextmenu-advanced-options", "hide");
        var advancedOptionsToggle = document.createElement("div");
        advancedOptionsToggle.classList.add("contextmenu-advanced-options-toggle");
        var advancedOptionsText = document.createElement("div");
        advancedOptionsText.innerText = "Advanced options";
        var advancedOptionsHr = document.createElement("hr");
        advancedOptionsToggle.append(advancedOptionsText, advancedOptionsHr);
        advancedOptionsToggle.addEventListener("click", () => {advancedOptionsDiv.classList.toggle("hide")});       
        advancedOptionsDiv.append(this.#unitCountryDropdownEl, this.#unitLiveryDropdownEl);
        if (this.#unitLoadoutPreviewEl !== null)
            advancedOptionsDiv.append(this.#unitLoadoutPreviewEl)

        /* Create the unit deploy button */
        this.#deployUnitButtonEl = document.createElement("button");
        this.#deployUnitButtonEl.classList.add("deploy-unit-button");
        this.#deployUnitButtonEl.disabled = true;
        this.#deployUnitButtonEl.innerText = "Deploy unit";
        this.#deployUnitButtonEl.setAttribute("data-coalition", "blue");
        this.#deployUnitButtonEl.addEventListener("click", () => { this.#deployUnits(); });

        /* Assemble all components */
        this.#container.append(this.#unitRoleTypeDropdownEl, unitLabelCountContainerEl)
        if (this.#unitLoadoutDropdownEl !== null)
            this.#container.append(this.#unitLoadoutDropdownEl)
        this.#container.append(advancedOptionsToggle, advancedOptionsDiv, this.#deployUnitButtonEl);

        /* Load the country codes from the public folder */
        var xhr = new XMLHttpRequest();
        xhr.open('GET', 'images/countries/codes.json', true);
        xhr.responseType = 'json';
        xhr.onload = () => {
        var status = xhr.status;
            if (status === 200) {
                this.#countryCodes = xhr.response;
            } else {
                console.error(`Error retrieving country codes`)
            }
        };
        xhr.send();

        this.#container.addEventListener("unitRoleTypeChanged", () => {
            this.#unitLabelDropdown.reset();
            if (this.#unitLoadoutListEl !== null)
            this.#unitLoadoutListEl.replaceChildren();
            if (this.#unitLoadoutDropdown !== null)
                this.#unitLoadoutDropdown.reset();
            if (this.#unitImageEl !== null)
                this.#unitImageEl.classList.toggle("hide", true);
            this.#unitLiveryDropdown.reset();
            
            if (this.#options.orderByRole)
                this.#unitLabelDropdown.setOptions(this.#unitDatabase.getByRole(this.#spawnOptions.roleType).map((blueprint) => { return blueprint.label }));
            else
                this.#unitLabelDropdown.setOptions(this.#unitDatabase.getByType(this.#spawnOptions.roleType).map((blueprint) => { return blueprint.label }));
            this.#container.dispatchEvent(new Event("resize")); 
            this.#computeSpawnPoints();
        })

        this.#container.addEventListener("unitLabelChanged", () => {
            if (this.#unitLoadoutDropdown !== null) {
                this.#unitLoadoutDropdown.setOptions(this.#unitDatabase.getLoadoutNamesByRole(this.#spawnOptions.name, this.#spawnOptions.roleType));
                this.#unitLoadoutDropdown.selectValue(0);
            }
            if (this.#unitImageEl !== null) {
                this.#unitImageEl.src = `images/units/${this.#unitDatabase.getByName(this.#spawnOptions.name)?.filename}`;
                this.#unitImageEl.classList.toggle("hide", false);
            }
            this.#setUnitLiveryOptions();

            this.#container.dispatchEvent(new Event("resize")); 
            this.#computeSpawnPoints();
        })    

        this.#container.addEventListener("unitLoadoutChanged", () => {
            this.#deployUnitButtonEl.disabled = false;
            var items = this.#spawnOptions.loadout?.items.map((item: any) => { return `${item.quantity}x ${item.name}`; });
            if (items != undefined && this.#unitLoadoutListEl !== null) {
                items.length == 0 ? items.push("Empty loadout") : "";
                this.#unitLoadoutListEl.replaceChildren(
                    ...items.map((item: any) => {
                        var div = document.createElement('div');
                        div.innerText = item;
                        return div;
                    })
                );
            }
        
            this.#container.dispatchEvent(new Event("resize")); 
        })

        this.#container.addEventListener("unitCountChanged", () => {
            this.#computeSpawnPoints();
        })    

        this.#container.addEventListener("unitCountryChanged", () => {
            this.#setUnitLiveryOptions();
        }) 

        this.#container.addEventListener("unitLiveryChanged", () => {

        })
    }

    getContainer() {
        return this.#container;
    }

    reset() {
        this.#deployUnitButtonEl.disabled = true;
        this.#unitRoleTypeDropdown.reset();
        this.#unitLabelDropdown.reset();
        this.#unitLiveryDropdown.reset();
        if (this.#options.orderByRole)
            this.#unitRoleTypeDropdown.setOptions(this.#unitDatabase.getRoles());
        else
            this.#unitRoleTypeDropdown.setOptions(this.#unitDatabase.getTypes());

        if (this.#unitLoadoutListEl !== null)
            this.#unitLoadoutListEl.replaceChildren();
        if (this.#unitLoadoutDropdown !== null)
            this.#unitLoadoutDropdown.reset();
        if (this.#unitImageEl !== null)
            this.#unitImageEl.classList.toggle("hide", true);

        this.setCountries();
        this.#container.dispatchEvent(new Event("resize")); 
    }

    setCountries() {
        var coalitions = getMissionHandler().getCoalitions();
        var countries = Object.values(coalitions[getActiveCoalition() as keyof typeof coalitions]);
        this.#unitCountryDropdown.setOptionsElements(this.#createCountryButtons(this.#unitCountryDropdown, countries, (country: string) => {this.#setUnitCountry(country)}));

        if (countries.length > 0 && !countries.includes(this.#spawnOptions.country)) {
            this.#unitCountryDropdown.forceValue(countries[0]);
            this.#setUnitCountry(countries[0]);
        }
    }

    refreshOptions() {
        //if (!this.#unitDatabase.getTypes().includes(this.#unitTypeDropdown.getValue())) 
        //    this.reset();
        //if (!this.#unitDatabase.getByType(this.#unitTypeDropdown.getValue()).map((blueprint) => { return blueprint.label }).includes(this.#unitLabelDropdown.getValue())) 
        //    this.resetUnitLabel();
    }

    setAirbase(airbase: Airbase | undefined) {
        this.#spawnOptions.airbase = airbase;
    }

    setLatLng(latlng: LatLng) {
        this.#spawnOptions.latlng = latlng;
    }

    #setUnitRoleType(roleType: string) {
        this.#spawnOptions.roleType = roleType;
        this.#container.dispatchEvent(new Event("unitRoleTypeChanged"));
    }

    #setUnitLabel(label: string) {
        var name = this.#unitDatabase.getByLabel(label)?.name || null;
        if (name != null) 
            this.#spawnOptions.name = name;
        this.#container.dispatchEvent(new Event("unitLabelChanged"));
    }

    #setUnitLoadout(loadoutName: string) {
        var loadout = this.#unitDatabase.getLoadoutByName(this.#spawnOptions.name, loadoutName);
        if (loadout) 
            this.#spawnOptions.loadout = loadout;  
        this.#container.dispatchEvent(new Event("unitLoadoutChanged"));  
    }

    #setUnitCount(count: string) {
        this.#spawnOptions.count = parseInt(count);
        this.#container.dispatchEvent(new Event("unitCountChanged"));
    }

    #setUnitCountry(country: string) {
        this.#spawnOptions.country = country;
        this.#container.dispatchEvent(new Event("unitCountryChanged"));
    }

    #setUnitLivery(liveryName: string) {
        var liveries = this.#unitDatabase.getByName(this.#spawnOptions.name)?.liveries;
        if (liveries !== undefined) {
            for (let liveryID in liveries)
                if (liveries[liveryID].name === liveryName)
                    this.#spawnOptions.liveryID = liveryID;
        }
        this.#container.dispatchEvent(new Event("unitLiveryChanged"));
    }

    #addDropdown(defaultText: string) {
        var div = document.createElement("div");
        div.classList.add("ol-select");
        
        var value = document.createElement("div");
        value.classList.add("ol-select-value");
        value.innerText = defaultText;
        
        var options = document.createElement("div");
        options.classList.add("ol-select-options");

        div.append(value, options);
        return div;
    }

    #setUnitLiveryOptions() {
        if (this.#spawnOptions.name !== "" && this.#spawnOptions.country !== "") {
            var liveries = this.#unitDatabase.getLiveryNamesByName(this.#spawnOptions.name);
            var countryLiveries: string[] = ["Default"];
            liveries.forEach((livery: any) => {
                var nationLiveryCodes = this.#countryCodes[this.#spawnOptions.country].liveryCodes;
                if (livery.countries.some((country: string) => {return nationLiveryCodes.includes(country)})) 
                    countryLiveries.push(livery.name);
            });
            this.#unitLiveryDropdown.setOptions(countryLiveries);
            this.#unitLiveryDropdown.selectValue(0);
        }
    }

    #deployUnits() {
        this.#spawnOptions.coalition = getActiveCoalition();
        if (this.#spawnOptions) {
            var unitTable = {
                unitType: this.#spawnOptions.name, 
                location: this.#spawnOptions.latlng, 
                altitude: this.#spawnOptions.altitude, 
                loadout: this.#spawnOptions.loadout, 
                liveryID: this.#spawnOptions.liveryID
            };
            var units = [];
            for (let i = 1; i < parseInt(this.#unitCountDropdown.getValue()) + 1; i++) {
                units.push(unitTable);
            }
            if (getUnitsManager().spawnUnits("Unit", units, getActiveCoalition(), false, this.#spawnOptions.airbase? this.#spawnOptions.airbase.getName(): "", this.#spawnOptions.country)) {
                getMap().addTemporaryMarker(this.#spawnOptions.latlng, this.#spawnOptions.name, getActiveCoalition());
                getMap().getMapContextMenu().hide();
            }
        }
    }

    #createCountryButtons(parent: Dropdown, countries: string[], callback: CallableFunction) {
        return Object.values(countries).map((country: string) => {
            var el = document.createElement("div");

            var formattedCountry = "";
            if (this.#countryCodes[country] !== undefined && this.#countryCodes[country].displayName !== undefined) 
                formattedCountry = this.#countryCodes[country].displayName;
            else
                formattedCountry = country.charAt(0).toUpperCase() + country.slice(1).toLowerCase();
            
            var button = document.createElement("button");
            button.classList.add("country-dropdown-element");
            el.appendChild(button);
            button.addEventListener("click", () => {
                callback(country);
                parent.forceValue(formattedCountry);
                parent.close();
            });
            if (this.#countryCodes[country] !== undefined) {
                var code = this.#countryCodes[country].flagCode;
                if (code !== undefined) {
                    var img = document.createElement("img");
                    img.src = `images/countries/${code.toLowerCase()}.svg`;
                    button.appendChild(img);
                }
            }
            else {
                console.log("Unknown country " + country);
            }
            var text = document.createElement("div");
            text.innerText = formattedCountry;
            button.appendChild(text);
            return el;
        });
    }

    #computeSpawnPoints() {
        if (getMissionHandler() && getMissionHandler().getCommandModeOptions().commandMode !== GAME_MASTER){
            var unitCount = parseInt(this.#unitCountDropdown.getValue());
            var unitSpawnPoints = unitCount * this.#unitDatabase.getSpawnPointsByLabel(this.#unitLabelDropdown.getValue());
            this.#deployUnitButtonEl.dataset.points = `${unitSpawnPoints}`;
            this.#deployUnitButtonEl.disabled = unitSpawnPoints >= getMissionHandler().getAvailableSpawnPoints();
        }
    }
}