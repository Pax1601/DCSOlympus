import { LatLng } from "leaflet";
import { Dropdown } from "./dropdown";
import { Slider } from "./slider";
import { UnitDatabase } from "../unit/unitdatabase";
import { getActiveCoalition, getMap, getMissionHandler, getUnitsManager } from "..";
import { GAME_MASTER } from "../constants/constants";
import { UnitSpawnOptions } from "../@types/unitdatabase";
import { Airbase } from "../mission/airbase";
import { ftToM } from "../other/utils";
import { aircraftDatabase } from "../unit/aircraftdatabase";
import { helicopterDatabase } from "../unit/helicopterdatabase";
import { groundUnitDatabase } from "../unit/groundunitdatabase";
import { navyUnitDatabase } from "../unit/navyunitdatabase";

export class UnitSpawnMenu {
    #container: HTMLElement;
    #unitDatabase: UnitDatabase;
    #countryCodes: any;
    #orderByRole: boolean;
    #spawnOptions: UnitSpawnOptions = { 
        roleType: "", 
        name: "", 
        latlng: new LatLng(0, 0), 
        coalition: "blue", 
        count: 1, 
        country: "", 
        loadout: undefined, 
        airbase: undefined, 
        liveryID: undefined, 
        altitude: undefined
     };

    /* Controls */
    #unitRoleTypeDropdown: Dropdown;
    #unitLabelDropdown: Dropdown;
    #unitCountDropdown: Dropdown;
    #unitLoadoutDropdown: Dropdown;
    #unitCountryDropdown: Dropdown;
    #unitLiveryDropdown: Dropdown;
    #unitSpawnAltitudeSlider: Slider;

    /* HTML Elements */
    #deployUnitButtonEl: HTMLButtonElement;
    #unitLoadoutPreviewEl: HTMLDivElement;
    #unitImageEl: HTMLImageElement;
    #unitLoadoutListEl: HTMLDivElement;

    constructor(ID: string, unitDatabase: UnitDatabase, orderByRole: boolean) {
        this.#container = document.getElementById(ID) as HTMLElement;
        this.#unitDatabase = unitDatabase;
        this.#orderByRole = orderByRole;

        /* Create the dropdowns and the altitude slider */
        this.#unitRoleTypeDropdown = new Dropdown(null, (roleType: string) => this.#setUnitRoleType(roleType), undefined, "Unit type");
        this.#unitLabelDropdown = new Dropdown(null, (label: string) => this.#setUnitLabel(label), undefined, "Unit label");
        this.#unitLoadoutDropdown = new Dropdown(null, (loadout: string) => this.#setUnitLoadout(loadout), undefined, "Unit loadout");
        this.#unitCountDropdown = new Dropdown(null, (count: string) => this.#setUnitCount(count), undefined, "Unit count");
        this.#unitCountryDropdown = new Dropdown(null, () => { /* Custom button implementation */ }, undefined, "Unit country");
        this.#unitLiveryDropdown = new Dropdown(null, (livery: string) => this.#setUnitLivery(livery), undefined, "Unit livery");
        this.#unitSpawnAltitudeSlider = new Slider(null, 0, 1000, "ft", (value: number) => { this.#spawnOptions.altitude = ftToM(value); }, { title: "Spawn altitude" });

        /* The unit label and unit count are in the same "row" for clarity and compactness */
        var unitLabelCountContainerEl = document.createElement("div");
        unitLabelCountContainerEl.classList.add("unit-label-count-container");
        var divider = document.createElement("div");
        divider.innerText = "x";
        unitLabelCountContainerEl.append(this.#unitLabelDropdown.getContainer(), divider, this.#unitCountDropdown.getContainer());

        /* Create the unit image and loadout elements */
        this.#unitLoadoutPreviewEl = document.createElement("div");
        this.#unitLoadoutPreviewEl.classList.add("unit-loadout-preview");
        this.#unitImageEl = document.createElement("img");
        this.#unitImageEl.classList.add("unit-image", "hide");
        this.#unitLoadoutListEl = document.createElement("div");
        this.#unitLoadoutListEl.classList.add("unit-loadout-list");
        this.#unitLoadoutPreviewEl.append(this.#unitImageEl, this.#unitLoadoutListEl);

        /* Create the divider and the advanced options collapsible div */
        var advancedOptionsDiv = document.createElement("div");
        advancedOptionsDiv.classList.add("contextmenu-advanced-options", "hide");
        var advancedOptionsToggle = document.createElement("div");
        advancedOptionsToggle.classList.add("contextmenu-advanced-options-toggle");
        var advancedOptionsText = document.createElement("div");
        advancedOptionsText.innerText = "Advanced options";
        var advancedOptionsHr = document.createElement("hr");
        advancedOptionsToggle.append(advancedOptionsText, advancedOptionsHr);
        advancedOptionsToggle.addEventListener("click", () => { 
            advancedOptionsDiv.classList.toggle("hide");
            this.#container.dispatchEvent(new Event("resize"));
        });
        advancedOptionsDiv.append(this.#unitCountryDropdown.getContainer(), this.#unitLiveryDropdown.getContainer(),
            this.#unitLoadoutPreviewEl, this.#unitSpawnAltitudeSlider.getContainer() as HTMLElement);

        /* Create the unit deploy button */
        this.#deployUnitButtonEl = document.createElement("button");
        this.#deployUnitButtonEl.classList.add("deploy-unit-button");
        this.#deployUnitButtonEl.disabled = true;
        this.#deployUnitButtonEl.innerText = "Deploy unit";
        this.#deployUnitButtonEl.setAttribute("data-coalition", "blue");
        this.#deployUnitButtonEl.addEventListener("click", () => { 
            this.deployUnits(this.#spawnOptions, parseInt(this.#unitCountDropdown.getValue()));
         });

        /* Assemble all components */
        this.#container.append(this.#unitRoleTypeDropdown.getContainer(), unitLabelCountContainerEl, this.#unitLoadoutDropdown.getContainer(),
            advancedOptionsToggle, advancedOptionsDiv, this.#deployUnitButtonEl);

        /* Load the country codes from the public folder */
        var xhr = new XMLHttpRequest();
        xhr.open('GET', 'images/countries/codes.json', true);
        xhr.responseType = 'json';
        xhr.onload = () => {
            var status = xhr.status;
            if (status === 200) 
                this.#countryCodes = xhr.response;
            else 
                console.error(`Error retrieving country codes`) 
        };
        xhr.send();

        /* Event listeners */
        this.#container.addEventListener("unitRoleTypeChanged", () => {
            this.#deployUnitButtonEl.disabled = true;
            this.#unitLabelDropdown.reset();
            this.#unitLoadoutListEl.replaceChildren();
            this.#unitLoadoutDropdown.reset();
            this.#unitImageEl.classList.toggle("hide", true);
            this.#unitLiveryDropdown.reset();

            if (this.#orderByRole)
                this.#unitLabelDropdown.setOptions(this.#unitDatabase.getByRole(this.#spawnOptions.roleType).map((blueprint) => { return blueprint.label }));
            else
                this.#unitLabelDropdown.setOptions(this.#unitDatabase.getByType(this.#spawnOptions.roleType).map((blueprint) => { return blueprint.label }));
            this.#container.dispatchEvent(new Event("resize"));

            this.#spawnOptions.name = "";
            this.#spawnOptions.loadout = undefined;
            this.#spawnOptions.liveryID = undefined;

            this.#computeSpawnPoints();
        })

        this.#container.addEventListener("unitLabelChanged", () => {
            this.#deployUnitButtonEl.disabled = false;
            if (!this.#unitLoadoutDropdown.isHidden()) {
                this.#unitLoadoutDropdown.setOptions(this.#unitDatabase.getLoadoutNamesByRole(this.#spawnOptions.name, this.#spawnOptions.roleType));
                this.#unitLoadoutDropdown.selectValue(0);
            }

            this.#unitImageEl.src = `images/units/${this.#unitDatabase.getByName(this.#spawnOptions.name)?.filename}`;
            this.#unitImageEl.classList.toggle("hide", false);
            
            this.#setUnitLiveryOptions();

            this.#container.dispatchEvent(new Event("resize"));
            this.#computeSpawnPoints();
        })

        this.#container.addEventListener("unitLoadoutChanged", () => {
            var items = this.#spawnOptions.loadout?.items.map((item: any) => { return `${item.quantity}x ${item.name}`; });
            if (items != undefined) {
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
        if (this.#orderByRole)
            this.#unitRoleTypeDropdown.setOptions(this.#unitDatabase.getRoles());
        else
            this.#unitRoleTypeDropdown.setOptions(this.#unitDatabase.getTypes());

        this.#unitLoadoutListEl.replaceChildren();
        this.#unitLoadoutDropdown.reset();
        this.#unitImageEl.classList.toggle("hide", true);

        this.setCountries();
        this.#container.dispatchEvent(new Event("resize"));
    }

    setCountries() {
        var coalitions = getMissionHandler().getCoalitions();
        var countries = Object.values(coalitions[getActiveCoalition() as keyof typeof coalitions]);
        this.#unitCountryDropdown.setOptionsElements(this.#createCountryButtons(this.#unitCountryDropdown, countries, (country: string) => { this.#setUnitCountry(country) }));

        if (countries.length > 0 && !countries.includes(this.#spawnOptions.country)) {
            this.#unitCountryDropdown.forceValue(this.#getFormattedCountry(countries[0]));
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

    setMaxUnitCount(maxUnitCount: number) {
        /* Create the unit count options */
        var countOptions: string[] = [];
        for (let i = 1; i <= maxUnitCount; i++)
            countOptions.push(i.toString());
        this.#unitCountDropdown.setOptions(countOptions);
        this.#unitCountDropdown.selectValue(0);
    }

    getRoleTypeDrodown() {
        return this.#unitRoleTypeDropdown;
    }

    getLabelDropdown() {
        return this.#unitLabelDropdown;
    }

    getCountDropdown() {
        return this.#unitCountDropdown;
    }

    getLoadoutDropdown() {
        return this.#unitLoadoutDropdown;
    }

    getCountryDropdown() {
        return this.#unitCountDropdown;
    }

    getLiveryDropdown() {
        return this.#unitLiveryDropdown;
    }

    getLoadoutPreview() {
        return this.#unitLoadoutPreviewEl;
    }

    getAltitudeSlider() {
        return this.#unitSpawnAltitudeSlider;
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
        if (liveryName === "Default") {
            this.#spawnOptions.liveryID = "";
        }
        else {
            if (liveries !== undefined) {
                for (let liveryID in liveries)
                    if (liveries[liveryID].name === liveryName)
                        this.#spawnOptions.liveryID = liveryID;
            }
        }
        this.#container.dispatchEvent(new Event("unitLiveryChanged"));
    }

    #setUnitLiveryOptions() {
        if (this.#spawnOptions.name !== "" && this.#spawnOptions.country !== "") {
            var liveries = this.#unitDatabase.getLiveryNamesByName(this.#spawnOptions.name);
            var countryLiveries: string[] = ["Default"];
            liveries.forEach((livery: any) => {
                var nationLiveryCodes = this.#countryCodes[this.#spawnOptions.country].liveryCodes;
                if (livery.countries === "All" || livery.countries.some((country: string) => { return nationLiveryCodes.includes(country) }))
                    countryLiveries.push(livery.name);
            });
            this.#unitLiveryDropdown.setOptions(countryLiveries);
            this.#unitLiveryDropdown.selectValue(0);
        }
    }

    deployUnits(spawnOptions: UnitSpawnOptions, unitsCount: number) {
        /* Virtual function must be overloaded by inheriting classes */
    }

    #createCountryButtons(parent: Dropdown, countries: string[], callback: CallableFunction) {
        return Object.values(countries).map((country: string) => {
            var el = document.createElement("div");

            var button = document.createElement("button");
            button.classList.add("country-dropdown-element");
            el.appendChild(button);
            button.addEventListener("click", () => {
                callback(country);
                parent.forceValue(this.#getFormattedCountry(country));
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
            text.innerText = this.#getFormattedCountry(country);
            button.appendChild(text);
            return el;
        });
    }

    #getFormattedCountry(country: string) {
        var formattedCountry = "";
        if (this.#countryCodes[country] !== undefined && this.#countryCodes[country].displayName !== undefined)
            formattedCountry = this.#countryCodes[country].displayName;
        else
            formattedCountry = country.charAt(0).toUpperCase() + country.slice(1).toLowerCase();
        return formattedCountry;
    }

    #computeSpawnPoints() {
        if (getMissionHandler() && getMissionHandler().getCommandModeOptions().commandMode !== GAME_MASTER) {
            var unitCount = parseInt(this.#unitCountDropdown.getValue());
            var unitSpawnPoints = unitCount * this.#unitDatabase.getSpawnPointsByLabel(this.#unitLabelDropdown.getValue());
            this.#deployUnitButtonEl.dataset.points = `${unitSpawnPoints}`;
            this.#deployUnitButtonEl.disabled = unitSpawnPoints >= getMissionHandler().getAvailableSpawnPoints();
        }
    }
}

export class AircraftSpawnMenu extends UnitSpawnMenu {
    /**
     * 
     * @param ID - the ID of the HTML element which will contain the context menu
     */
    constructor(ID: string){
        super(ID, aircraftDatabase, true);
        this.setMaxUnitCount(4);
        this.getAltitudeSlider().setMinMax(0, 50000);
        this.getAltitudeSlider().setIncrement(500);
        this.getAltitudeSlider().setValue(20000);
    }

    deployUnits(spawnOptions: UnitSpawnOptions, unitsCount: number) {
        spawnOptions.coalition = getActiveCoalition();
        if (spawnOptions) {
            var unitTable = {
                unitType: spawnOptions.name,
                location: spawnOptions.latlng,
                altitude: spawnOptions.altitude? spawnOptions.altitude: 0,
                loadout: spawnOptions.loadout? spawnOptions.loadout.name: "",
                liveryID: spawnOptions.liveryID? spawnOptions.liveryID: ""
            };
            var units = [];
            for (let i = 1; i < unitsCount + 1; i++) {
                units.push(unitTable);
            }
            if (getUnitsManager().spawnUnits("Aircraft", units, getActiveCoalition(), false, spawnOptions.airbase ? spawnOptions.airbase.getName() : "", spawnOptions.country)) {
                getMap().addTemporaryMarker(spawnOptions.latlng, spawnOptions.name, getActiveCoalition());
                getMap().getMapContextMenu().hide();
            }
        }
    }
}

export class HelicopterSpawnMenu extends UnitSpawnMenu {
    /**
     * 
     * @param ID - the ID of the HTML element which will contain the context menu
     */
    constructor(ID: string){
        super(ID, helicopterDatabase, true);
        this.setMaxUnitCount(4);
        this.getAltitudeSlider().setMinMax(0, 10000);
        this.getAltitudeSlider().setIncrement(100);
        this.getAltitudeSlider().setValue(5000);
    }

    deployUnits(spawnOptions: UnitSpawnOptions, unitsCount: number) {
        spawnOptions.coalition = getActiveCoalition();
        if (spawnOptions) {
            var unitTable = {
                unitType: spawnOptions.name,
                location: spawnOptions.latlng,
                altitude: spawnOptions.altitude? spawnOptions.altitude: 0,
                loadout: spawnOptions.loadout? spawnOptions.loadout.name: "",
                liveryID: spawnOptions.liveryID? spawnOptions.liveryID: ""
            };
            var units = [];
            for (let i = 1; i < unitsCount + 1; i++) {
                units.push(unitTable);
            }
            if (getUnitsManager().spawnUnits("Helicopter", units, getActiveCoalition(), false, spawnOptions.airbase ? spawnOptions.airbase.getName() : "", spawnOptions.country)) {
                getMap().addTemporaryMarker(spawnOptions.latlng, spawnOptions.name, getActiveCoalition());
                getMap().getMapContextMenu().hide();
            }
        }
    }
}

export class GroundUnitSpawnMenu extends UnitSpawnMenu {
    /**
     * 
     * @param ID - the ID of the HTML element which will contain the context menu
     */
    constructor(ID: string){
        super(ID, groundUnitDatabase, false);
        this.setMaxUnitCount(20);
        this.getAltitudeSlider().hide();
        this.getLoadoutDropdown().hide();
        this.getLoadoutPreview().classList.add("hide");
    }

    deployUnits(spawnOptions: UnitSpawnOptions, unitsCount: number) {
        spawnOptions.coalition = getActiveCoalition();
        if (spawnOptions) {
            var unitTable = {
                unitType: spawnOptions.name,
                location: spawnOptions.latlng,
                liveryID: spawnOptions.liveryID? spawnOptions.liveryID: ""
            };
            var units = [];
            for (let i = 1; i < unitsCount + 1; i++) {
                units.push(JSON.parse(JSON.stringify(unitTable)));
                unitTable.location.lat += 0.0001;
            }
            if (getUnitsManager().spawnUnits("GroundUnit", units, getActiveCoalition(), false, spawnOptions.airbase ? spawnOptions.airbase.getName() : "", spawnOptions.country)) {
                getMap().addTemporaryMarker(spawnOptions.latlng, spawnOptions.name, getActiveCoalition());
                getMap().getMapContextMenu().hide();
            }
        }
    }
}

export class NavyUnitSpawnMenu extends UnitSpawnMenu {
    /**
     * 
     * @param ID - the ID of the HTML element which will contain the context menu
     */
    constructor(ID: string){
        super(ID, navyUnitDatabase, false);
        this.setMaxUnitCount(4);
        this.getAltitudeSlider().hide();
        this.getLoadoutDropdown().hide();
        this.getLoadoutPreview().classList.add("hide");
    }

    deployUnits(spawnOptions: UnitSpawnOptions, unitsCount: number) {
        spawnOptions.coalition = getActiveCoalition();
        if (spawnOptions) {
            var unitTable = {
                unitType: spawnOptions.name,
                location: spawnOptions.latlng,
                liveryID: spawnOptions.liveryID? spawnOptions.liveryID: ""
            };
            var units = [];
            for (let i = 1; i < unitsCount + 1; i++) {
                units.push(JSON.parse(JSON.stringify(unitTable)));
                unitTable.location.lat += 0.0001;
            }
            if (getUnitsManager().spawnUnits("NavyUnit", units, getActiveCoalition(), false, spawnOptions.airbase ? spawnOptions.airbase.getName() : "", spawnOptions.country)) {
                getMap().addTemporaryMarker(spawnOptions.latlng, spawnOptions.name, getActiveCoalition());
                getMap().getMapContextMenu().hide();
            }
        }
    }
}