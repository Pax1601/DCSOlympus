import { Circle, LatLng } from "leaflet";
import { Dropdown } from "./dropdown";
import { Slider } from "./slider";
import { UnitDatabase } from "../unit/databases/unitdatabase";
import { getApp } from "..";
import { GAME_MASTER, GROUND_UNIT_AIR_DEFENCE_REGEX } from "../constants/constants";
import { Airbase } from "../mission/airbase";
import { ftToM } from "../other/utils";
import { aircraftDatabase } from "../unit/databases/aircraftdatabase";
import { helicopterDatabase } from "../unit/databases/helicopterdatabase";
import { groundUnitDatabase } from "../unit/databases/groundunitdatabase";
import { navyUnitDatabase } from "../unit/databases/navyunitdatabase";
import { UnitSpawnOptions, UnitSpawnTable } from "../interfaces";

export class UnitSpawnMenu {
    protected showRangeCircles: boolean = false;
    protected spawnOptions: UnitSpawnOptions = { 
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

    #container: HTMLElement;
    #unitDatabase: UnitDatabase;
    #countryCodes: any;
    #orderByRole: boolean;
    protected unitTypeFilter = (unit:any) => { return true; };

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
    #descriptionDiv: HTMLDivElement;
    #abilitiesDiv: HTMLDivElement;

    /* Range circle previews */
    #engagementCircle: Circle;
    #acquisitionCircle: Circle;

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
        this.#unitSpawnAltitudeSlider = new Slider(null, 0, 1000, "ft", (value: number) => { this.spawnOptions.altitude = ftToM(value); }, { title: "Spawn altitude" });

        /* The unit label and unit count are in the same "row" for clarity and compactness */
        var unitLabelCountContainerEl = document.createElement("div");
        unitLabelCountContainerEl.classList.add("unit-label-count-container");
        var divider = document.createElement("div");
        divider.innerText = "x";
        unitLabelCountContainerEl.append(this.#unitLabelDropdown.getContainer(), divider, this.#unitCountDropdown.getContainer());
        
        /* Create the unit image and loadout elements */
        this.#unitImageEl = document.createElement("img");
        this.#unitImageEl.classList.add("unit-image", "hide");
        this.#unitLoadoutPreviewEl = document.createElement("div");
        this.#unitLoadoutPreviewEl.classList.add("unit-loadout-preview");
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
            this.#unitSpawnAltitudeSlider.getContainer() as HTMLElement);

        /* Create the divider and the metadata collapsible div */
        var metadataDiv = document.createElement("div");
        metadataDiv.classList.add("contextmenu-metadata", "hide");
        var metadataToggle = document.createElement("div");
        metadataToggle.classList.add("contextmenu-metadata-toggle");
        var metadataText = document.createElement("div");
        metadataText.innerText = "Info";
        var metadataHr = document.createElement("hr");
        metadataToggle.append(metadataText, metadataHr);
        metadataToggle.addEventListener("click", () => { 
            metadataDiv.classList.toggle("hide");
            this.#container.dispatchEvent(new Event("resize"));
        });
        this.#descriptionDiv = document.createElement("div"); 
        this.#abilitiesDiv = document.createElement("div");
        metadataDiv.append(this.#descriptionDiv, this.#abilitiesDiv);

        /* Create the unit deploy button */
        this.#deployUnitButtonEl = document.createElement("button");
        this.#deployUnitButtonEl.classList.add("deploy-unit-button");
        this.#deployUnitButtonEl.disabled = true;
        this.#deployUnitButtonEl.innerText = "Deploy unit";
        this.#deployUnitButtonEl.setAttribute("data-coalition", "blue");
        this.#deployUnitButtonEl.addEventListener("click", () => { 
            this.deployUnits(this.spawnOptions, parseInt(this.#unitCountDropdown.getValue()));
         });

        /* Assemble all components */
        this.#container.append(this.#unitRoleTypeDropdown.getContainer(), unitLabelCountContainerEl, this.#unitLoadoutDropdown.getContainer(),
        this.#unitLoadoutPreviewEl, advancedOptionsToggle, advancedOptionsDiv, metadataToggle, metadataDiv, this.#deployUnitButtonEl);

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
                this.#unitLabelDropdown.setOptions(this.#unitDatabase.getByRole(this.spawnOptions.roleType).map((blueprint) => { return blueprint.label }), "string+number");
            else
                this.#unitLabelDropdown.setOptions(this.#unitDatabase.getByType(this.spawnOptions.roleType).map((blueprint) => { return blueprint.label }), "string+number");

            /* Add the tags to the options */
            var elements: HTMLElement[] = [];
            for (let idx = 0; idx < this.#unitLabelDropdown.getOptionElements().length; idx++) {
                let element = this.#unitLabelDropdown.getOptionElements()[idx] as HTMLElement;
                let entry = this.#unitDatabase.getByLabel(element.textContent ?? "");
                if (entry) {
                    element.querySelectorAll("button")[0]?.append(...(entry.tags?.split(",").map((tag: string) => {
                        tag = tag.trim();
                        let el = document.createElement("div");
                        el.classList.add("pill", `ol-tag`, `ol-tag-${tag.replace(/[\W_]+/g,"-")}`);
                        el.textContent = tag;
                        element.appendChild(el);
                        return el;
                    }) ?? []));
                    elements.push(element);
                }
            }

            this.#container.dispatchEvent(new Event("resize"));

            this.spawnOptions.name = "";
            this.spawnOptions.loadout = undefined;
            this.spawnOptions.liveryID = undefined;

            this.#computeSpawnPoints();
        })

        this.#container.addEventListener("unitLabelChanged", () => {
            this.#deployUnitButtonEl.disabled = false;
            if (!this.#unitLoadoutDropdown.isHidden()) {
                this.#unitLoadoutDropdown.setOptions(this.#unitDatabase.getLoadoutNamesByRole(this.spawnOptions.name, this.spawnOptions.roleType));
                this.#unitLoadoutDropdown.selectValue(0);
            }

            var blueprint = this.#unitDatabase.getByName(this.spawnOptions.name);


            this.#unitImageEl.src = `images/units/${blueprint?.filename}`;
            this.#unitImageEl.classList.toggle("hide", !(blueprint?.filename !== undefined));
            
            this.#setUnitLiveryOptions();

            this.#container.dispatchEvent(new Event("resize"));
            this.#computeSpawnPoints();

            this.#descriptionDiv.replaceChildren();
            this.#abilitiesDiv.replaceChildren();

            if (blueprint?.description)
                this.#descriptionDiv.textContent = blueprint.description;
            
            if (blueprint?.abilities) {
                var abilities = blueprint.abilities.split(",");
                this.#abilitiesDiv.replaceChildren();
                for (let ability of abilities) {
                    if (ability !== "") {
                        ability = ability.trimStart();
                        var div = document.createElement("div");
                        div.textContent = ability.charAt(0).toUpperCase() + ability.slice(1);
                        this.#abilitiesDiv.append(div);
                        div.classList.add("pill-light");
                    }
                }
            }

            this.showCirclesPreviews();
        })

        this.#container.addEventListener("unitLoadoutChanged", () => {
            var items = this.spawnOptions.loadout?.items.map((item: any) => { return `${item.quantity}x ${item.name}`; });
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

        document.addEventListener('activeCoalitionChanged', () => {
            this.showCirclesPreviews();
        });

        this.#engagementCircle = new Circle(this.spawnOptions.latlng, { radius: 0, weight: 4, opacity: 0.8, fillOpacity: 0, dashArray: "4 8", interactive: false, bubblingMouseEvents: false });
        this.#acquisitionCircle = new Circle(this.spawnOptions.latlng, { radius: 0, weight: 2, opacity: 0.8, fillOpacity: 0, dashArray: "8 12", interactive: false, bubblingMouseEvents: false });
    }

    getContainer() {
        return this.#container;
    }

    getVisible() {
        return !this.getContainer().classList.contains( "hide" );
    }

    reset() {
        this.#deployUnitButtonEl.disabled = true;
        this.#unitRoleTypeDropdown.reset();
        this.#unitLabelDropdown.reset();
        this.#unitLiveryDropdown.reset();
        if (this.#orderByRole)
            this.#unitRoleTypeDropdown.setOptions(this.#unitDatabase.getRoles());
        else
            this.#unitRoleTypeDropdown.setOptions(this.#unitDatabase.getTypes(this.unitTypeFilter));

        this.#unitLoadoutListEl.replaceChildren();
        this.#unitLoadoutDropdown.reset();
        this.#unitImageEl.classList.toggle("hide", true);
        this.#descriptionDiv.replaceChildren();
        this.#abilitiesDiv.replaceChildren();

        this.setCountries();
        this.#container.dispatchEvent(new Event("resize"));

        this.clearCirclesPreviews();
    }

    setCountries() {
        var coalitions = getApp().getMissionManager().getCoalitions();
        var countries = Object.values(coalitions[getApp().getActiveCoalition() as keyof typeof coalitions]);
        this.#unitCountryDropdown.setOptionsElements(this.#createCountryButtons(this.#unitCountryDropdown, countries, (country: string) => { this.#setUnitCountry(country) }));

        if (countries.length > 0 && !countries.includes(this.spawnOptions.country)) {
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

    showCirclesPreviews() {
        this.clearCirclesPreviews();

        if ( !this.showRangeCircles || this.spawnOptions.name === "" || !this.getVisible() ) {
            return;
        }
        
        let acquisitionRange = this.#unitDatabase.getByName(this.spawnOptions.name)?.acquisitionRange ?? 0;
        let engagementRange = this.#unitDatabase.getByName(this.spawnOptions.name)?.engagementRange ?? 0;

        if ( acquisitionRange === 0 && engagementRange === 0 ) {
            return;
        }

        this.#acquisitionCircle.setRadius(acquisitionRange);
        this.#engagementCircle.setRadius(engagementRange);
        this.#acquisitionCircle.setLatLng(this.spawnOptions.latlng);
        this.#engagementCircle.setLatLng(this.spawnOptions.latlng);

        switch (getApp().getActiveCoalition()) {
            case "red":
                this.#acquisitionCircle.options.color = "#D42121";
                break;
            case "blue":
                this.#acquisitionCircle.options.color = "#017DC1";
                break;
            default:
                this.#acquisitionCircle.options.color = "#111111"
                break;
        }

        switch (getApp().getActiveCoalition()) {
            case "red":
                this.#engagementCircle.options.color = "#FF5858";
                break;
            case "blue":
                this.#engagementCircle.options.color = "#3BB9FF";
                break;
            default:
                this.#engagementCircle.options.color = "#CFD9E8"
                break;
        }

        if (engagementRange > 0)
            this.#engagementCircle.addTo(getApp().getMap());

        if (acquisitionRange > 0)
            this.#acquisitionCircle.addTo(getApp().getMap());
    }

    clearCirclesPreviews() {
        this.#engagementCircle.removeFrom(getApp().getMap());
        this.#acquisitionCircle.removeFrom(getApp().getMap());
    }

    setAirbase(airbase: Airbase | undefined) {
        this.spawnOptions.airbase = airbase;
    }

    setLatLng(latlng: LatLng) {
        this.spawnOptions.latlng = latlng;

        this.showCirclesPreviews();
    }

    setMaxUnitCount(maxUnitCount: number) {
        /* Create the unit count options */
        this.#unitCountDropdown.setOptions( [...Array(maxUnitCount).keys()].map( n => (n+1).toString() ), "number");
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
        this.spawnOptions.roleType = roleType;
        this.#container.dispatchEvent(new Event("unitRoleTypeChanged"));
    }

    #setUnitLabel(label: string) {
        var name = this.#unitDatabase.getByLabel(label)?.name || null;
        if (name != null)
            this.spawnOptions.name = name;
        this.#container.dispatchEvent(new Event("unitLabelChanged"));
    }

    #setUnitLoadout(loadoutName: string) {
        var loadout = this.#unitDatabase.getLoadoutByName(this.spawnOptions.name, loadoutName);
        if (loadout)
            this.spawnOptions.loadout = loadout;
        this.#container.dispatchEvent(new Event("unitLoadoutChanged"));
    }

    #setUnitCount(count: string) {
        this.spawnOptions.count = parseInt(count);
        this.#container.dispatchEvent(new Event("unitCountChanged"));
    }

    #setUnitCountry(country: string) {
        this.spawnOptions.country = country;
        this.#container.dispatchEvent(new Event("unitCountryChanged"));
    }

    #setUnitLivery(liveryName: string) {
        var liveries = this.#unitDatabase.getByName(this.spawnOptions.name)?.liveries;
        if (liveryName === "Default") {
            this.spawnOptions.liveryID = "";
        }
        else {
            if (liveries !== undefined) {
                for (let liveryID in liveries)
                    if (liveries[liveryID].name === liveryName)
                        this.spawnOptions.liveryID = liveryID;
            }
        }
        this.#container.dispatchEvent(new Event("unitLiveryChanged"));
    }

    #setUnitLiveryOptions() {
        if (this.spawnOptions.name !== "" && this.spawnOptions.country !== "") {
            var liveries = this.#unitDatabase.getLiveryNamesByName(this.spawnOptions.name);
            var countryLiveries: string[] = ["Default"];
            liveries.forEach((livery: any) => {
                var nationLiveryCodes = this.#countryCodes[this.spawnOptions.country].liveryCodes;
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
        if (getApp().getMissionManager() && getApp().getMissionManager().getCommandModeOptions().commandMode !== GAME_MASTER) {
            var unitCount = parseInt(this.#unitCountDropdown.getValue());
            var unitSpawnPoints = unitCount * this.#unitDatabase.getSpawnPointsByLabel(this.#unitLabelDropdown.getValue());
            this.#deployUnitButtonEl.dataset.points = `${unitSpawnPoints}`;
            this.#deployUnitButtonEl.disabled = unitSpawnPoints >= getApp().getMissionManager().getAvailableSpawnPoints();
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
        this.spawnOptions.altitude = ftToM(20000);
    }

    deployUnits(spawnOptions: UnitSpawnOptions, unitsCount: number) {
        spawnOptions.coalition = getApp().getActiveCoalition();
        if (spawnOptions) {
            var unitTable: UnitSpawnTable = {
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

            getApp().getUnitsManager().spawnUnits("Aircraft", units, getApp().getActiveCoalition(), false, spawnOptions.airbase ? spawnOptions.airbase.getName() : "", spawnOptions.country, (res: any) => {
                if (res.commandHash !== undefined)
                    getApp().getMap().addTemporaryMarker(spawnOptions.latlng, spawnOptions.name, getApp().getActiveCoalition(), res.commandHash);
            });
                
            this.getContainer().dispatchEvent(new Event("hide"));
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
        this.spawnOptions.altitude = ftToM(5000);
    }

    deployUnits(spawnOptions: UnitSpawnOptions, unitsCount: number) {
        spawnOptions.coalition = getApp().getActiveCoalition();
        if (spawnOptions) {
            var unitTable: UnitSpawnTable = {
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
            
            getApp().getUnitsManager().spawnUnits("Helicopter", units, getApp().getActiveCoalition(), false, spawnOptions.airbase ? spawnOptions.airbase.getName() : "", spawnOptions.country, (res: any) => {
                if (res.commandHash !== undefined)
                    getApp().getMap().addTemporaryMarker(spawnOptions.latlng, spawnOptions.name, getApp().getActiveCoalition(), res.commandHash);
            });
                
            this.getContainer().dispatchEvent(new Event("hide"));
        }
    }
}

export class GroundUnitSpawnMenu extends UnitSpawnMenu {

    protected showRangeCircles: boolean = true;
    protected unitTypeFilter = (unit:any) => {return !(GROUND_UNIT_AIR_DEFENCE_REGEX.test(unit.type))};

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
        spawnOptions.coalition = getApp().getActiveCoalition();
        if (spawnOptions) {
            var unitTable: UnitSpawnTable = {
                unitType: spawnOptions.name,
                location: spawnOptions.latlng,
                liveryID: spawnOptions.liveryID? spawnOptions.liveryID: ""
            };
            
            var units = [];
            for (let i = 0; i < unitsCount; i++) {
                units.push(JSON.parse(JSON.stringify(unitTable)));
                unitTable.location.lat += i > 0? 0.0001: 0;
            }

            getApp().getUnitsManager().spawnUnits("GroundUnit", units, getApp().getActiveCoalition(), false, spawnOptions.airbase ? spawnOptions.airbase.getName() : "", spawnOptions.country, (res: any) => {
                if (res.commandHash !== undefined)
                    getApp().getMap().addTemporaryMarker(spawnOptions.latlng, spawnOptions.name, getApp().getActiveCoalition(), res.commandHash);
            });
                
            this.getContainer().dispatchEvent(new Event("hide"));
        }
    }
}

export class AirDefenceUnitSpawnMenu extends GroundUnitSpawnMenu {

    protected unitTypeFilter = (unit:any) => {return GROUND_UNIT_AIR_DEFENCE_REGEX.test(unit.type)};

    /**
     * 
     * @param ID - the ID of the HTML element which will contain the context menu
     */
    constructor(ID: string){
        super(ID);
        this.setMaxUnitCount(4);
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
        spawnOptions.coalition = getApp().getActiveCoalition();
        if (spawnOptions) {
            var unitTable: UnitSpawnTable = {
                unitType: spawnOptions.name,
                location: spawnOptions.latlng,
                liveryID: spawnOptions.liveryID? spawnOptions.liveryID: ""
            };
            
            var units = [];
            for (let i = 0; i < unitsCount; i++) {
                units.push(JSON.parse(JSON.stringify(unitTable)));
                unitTable.location.lat += i > 0? 0.0001: 0;
            }
            
            getApp().getUnitsManager().spawnUnits("NavyUnit", units, getApp().getActiveCoalition(), false, spawnOptions.airbase ? spawnOptions.airbase.getName() : "", spawnOptions.country, (res: any) => {
                if (res.commandHash !== undefined)
                    getApp().getMap().addTemporaryMarker(spawnOptions.latlng, spawnOptions.name, getApp().getActiveCoalition(), res.commandHash);
            });
                
            this.getContainer().dispatchEvent(new Event("hide"));
        }
    }
}