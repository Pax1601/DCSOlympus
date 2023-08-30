import { LatLng } from "leaflet";
import { Dropdown } from "./dropdown";
import { Slider } from "./slider";
import { UnitDatabase } from "../unit/unitdatabase";
import { getActiveCoalition, getMap, getMissionHandler, getUnitsManager } from "..";
import { GAME_MASTER } from "../constants/constants";

export class UnitSpawnMenu {
    #unitRoleDropdown: Dropdown;
    #unitLabelDropdown: Dropdown;
    #unitCountDropdown: Dropdown;
    #unitLoadoutDropdown: Dropdown;
    #unitCountryDropdown: Dropdown;
    #unitLiveryDropdown: Dropdown;
    //#unitSpawnAltitudeSlider: Slider;

    #unitRoleDropdownEl: HTMLDivElement;
    #unitTypeDropdownEl: HTMLDivElement;
    #unitLoadoutDropdownEl: HTMLDivElement;
    #unitCountDropdownEl: HTMLDivElement;
    #unitCountryDropdownEl: HTMLDivElement;
    #unitLiveryDropdownEl: HTMLDivElement;
    #deployUnitButtonEl: HTMLButtonElement;
    #unitLoadoutPreview: HTMLDivElement;
    #unitImage: HTMLImageElement;
    #unitLoadoutList: HTMLDivElement;

    #container: HTMLElement;
    #spawnOptions = { role: "", name: "", latlng: new LatLng(0, 0), coalition: "blue", loadout: "", airbaseName: "", liveryID: "", altitude: 0, count: 1, country: "" };
    #unitDatabase: UnitDatabase;
    #countryCodes: any;

    constructor(id: string, unitDatabase: UnitDatabase, options?: {maxUnitCount: number, showLoadout: boolean}) {
        this.#container = document.getElementById(id) as HTMLElement;
        this.#unitDatabase = unitDatabase;

        this.#unitRoleDropdownEl = this.#addDropdown("Unit role");
        this.#unitTypeDropdownEl = this.#addDropdown("Unit type");
        this.#unitLoadoutDropdownEl = this.#addDropdown("Unit loadout");
        this.#unitCountDropdownEl = this.#addDropdown("Unit count");
        this.#unitCountryDropdownEl = this.#addDropdown("Unit country");
        this.#unitLiveryDropdownEl = this.#addDropdown("Unit livery");

        this.#unitRoleDropdown = new Dropdown(this.#unitRoleDropdownEl, (role: string) => this.#setUnitRole(role));
        this.#unitLabelDropdown = new Dropdown(this.#unitTypeDropdownEl, (type: string) => this.#setUnitLabel(type));
        this.#unitLoadoutDropdown = new Dropdown(this.#unitLoadoutDropdownEl, (loadout: string) => this.#setUnitLoadout(loadout)); 
        this.#unitCountDropdown = new Dropdown(this.#unitCountDropdownEl, (count: string) => this.#setUnitCount(count));
        this.#unitCountDropdown.setOptions(["1", "2", "3", "4"]);
        this.#unitCountryDropdown = new Dropdown(this.#unitCountryDropdownEl, () => { /* Custom button implementation */ });
        this.#unitLiveryDropdown = new Dropdown(this.#unitLiveryDropdownEl, (livery: string) => this.#setUnitLivery(livery));
        //this.#unitSpawnAltitudeSlider = new Slider("unit-spawn-altitude-slider", 0, 50000, "ft", (value: number) => {this.#spawnOptions.altitude = ftToM(value);});
        //this.#unitSpawnAltitudeSlider.setIncrement(500);
        //this.#unitSpawnAltitudeSlider.setValue(20000);
        //this.#unitSpawnAltitudeSlider.setActive(true);

        this.#unitLoadoutPreview = document.createElement("div");
        this.#unitLoadoutPreview.classList.add("unit-loadout-preview");
        this.#unitImage = document.createElement("img");
        this.#unitImage.classList.add("unit-image", "hide");
        this.#unitLoadoutList = document.createElement("div");
        this.#unitLoadoutList.classList.add("unit-loadout-list");
        this.#unitLoadoutPreview.append(this.#unitImage, this.#unitLoadoutList);

        var advancedOptionsDiv = document.createElement("div");
        advancedOptionsDiv.classList.add("contextmenu-advanced-options", "hide");
        var advancedOptionsToggle = document.createElement("div");
        advancedOptionsToggle.classList.add("contextmenu-advanced-options-toggle");
        var advancedOptionsText = document.createElement("div");
        advancedOptionsText.innerText = "Advanced options";
        var advancedOptionsHr = document.createElement("hr");
        advancedOptionsToggle.append(advancedOptionsText, advancedOptionsHr);
        advancedOptionsToggle.addEventListener("click", () => {advancedOptionsDiv.classList.toggle("hide")});       
        advancedOptionsDiv.append(this.#unitCountryDropdownEl, this.#unitLiveryDropdownEl, this.#unitLoadoutPreview);

        this.#deployUnitButtonEl = document.createElement("button");
        this.#deployUnitButtonEl.classList.add("deploy-unit-button");
        this.#deployUnitButtonEl.disabled = true;
        this.#deployUnitButtonEl.innerText = "Deploy unit";
        this.#deployUnitButtonEl.setAttribute("data-coalition", "blue");
        this.#deployUnitButtonEl.addEventListener("click", () => { this.#deployUnits(); });

        this.#container.append(this.#unitRoleDropdownEl, this.#unitTypeDropdownEl, this.#unitLoadoutDropdownEl, this.#unitCountDropdownEl, 
            advancedOptionsToggle, advancedOptionsDiv, this.#deployUnitButtonEl);

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

    ///********* Unit spawn menu *********/
    #setUnitRole(role: string) {
        this.#spawnOptions.role = role;
        this.resetUnitLabel();
        this.#unitLabelDropdown.setOptions(this.#unitDatabase.getByRole(role).map((blueprint) => { return blueprint.label }));
        this.#unitLabelDropdown.selectValue(0);
        this.#container.dispatchEvent(new Event("resize")); 
        this.#computeSpawnPoints();
    }

    resetUnitRole() {
        this.#deployUnitButtonEl.disabled = true;
        //(<HTMLButtonElement>this.getContainer()?.querySelector("#unit-loadout-list")).replaceChildren();
        this.#unitRoleDropdown.reset();
        this.#unitLabelDropdown.reset();
        this.#unitRoleDropdown.setOptions(this.#unitDatabase.getRoles());
        this.#container.dispatchEvent(new Event("resize")); 
    }

    #setUnitLabel(label: string) {
        this.resetUnitLabel();
        var name = this.#unitDatabase.getByLabel(label)?.name || null;
        if (name != null) {
            this.#spawnOptions.name = name;
            this.#unitLoadoutDropdown.setOptions(this.#unitDatabase.getLoadoutNamesByRole(name, this.#spawnOptions.role));
            this.#unitLoadoutDropdown.selectValue(0);
            //var image = (<HTMLImageElement>this.getContainer()?.querySelector("#unit-unit-image"));
            //image.src = `images/units/${this.#unitDatabase.getByLabel(label)?.filename}`;
            //image.classList.toggle("hide", false);
            this.#setUnitLiveryOptions();
        }
        this.#container.dispatchEvent(new Event("resize")); 
        this.#computeSpawnPoints();
    }

    resetUnitLabel() {
        this.#deployUnitButtonEl.disabled = true;
    //    //(<HTMLButtonElement>this.getContainer()?.querySelector("#unit-loadout-list")).replaceChildren();
        this.#unitLoadoutDropdown.reset();
        this.#unitLiveryDropdown.reset();
        //(<HTMLImageElement>this.getContainer()?.querySelector("#unit-unit-image")).classList.toggle("hide", true);
        this.#container.dispatchEvent(new Event("resize")); 
    }

    #setUnitCount(count: string) {
        this.#spawnOptions.count = parseInt(count);
        this.#container.dispatchEvent(new Event("resize")); 
        this.#computeSpawnPoints();
    }

    #setUnitLoadout(loadoutName: string) {
        var loadout = this.#unitDatabase.getLoadoutByName(this.#spawnOptions.name, loadoutName);
        if (loadout) {
            this.#spawnOptions.loadout = loadout.code;
            this.#deployUnitButtonEl.disabled = false;
            var items = loadout.items.map((item: any) => { return `${item.quantity}x ${item.name}`; });
            items.length == 0 ? items.push("Empty loadout") : "";
            //(<HTMLButtonElement>this.getContainer()?.querySelector("#unit-loadout-list")).replaceChildren(
            //    ...items.map((item: any) => {
            //        var div = document.createElement('div');
            //        div.innerText = item;
            //        return div;
            //    })
            //)
        }
        this.#container.dispatchEvent(new Event("resize")); 
    }

    #setUnitLivery(liveryName: string) {
        var liveries = this.#unitDatabase.getByName(this.#spawnOptions.name)?.liveries;
        if (liveries !== undefined) {
            for (let liveryID in liveries)
                if (liveries[liveryID].name === liveryName)
                    this.#spawnOptions.liveryID = liveryID;
        }
        this.#container.dispatchEvent(new Event("resize")); 
    }

    #setUnitCountry(country: string) {
        this.#spawnOptions.country = country;
        this.#setUnitLiveryOptions();
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
            if (getUnitsManager().spawnUnits("Unit", units, getActiveCoalition(), false, this.#spawnOptions.airbaseName, this.#spawnOptions.country)) {
                getMap().addTemporaryMarker(this.#spawnOptions.latlng, this.#spawnOptions.name, getActiveCoalition());
                getMap().getMapContextMenu().hide();
            }
        }
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

    refreshOptions() {
        if (!this.#unitDatabase.getRoles().includes(this.#unitRoleDropdown.getValue())) 
            this.resetUnitRole();
        if (!this.#unitDatabase.getByRole(this.#unitRoleDropdown.getValue()).map((blueprint) => { return blueprint.label }).includes(this.#unitLabelDropdown.getValue())) 
            this.resetUnitLabel();
    }
}