import { LatLng } from "leaflet";

export type contextMenuTypes = "airbase" | "airbaseSpawn" | "coalitionArea" | "default" | "map" | "unit";

export type contextMenuConfig = {
    "baseClass": contextMenuTypes,
    "id": string | HTMLElement,
    "onBeforeShow"?: CallableFunction,
    "onInit"?: CallableFunction,
    "onShow"?: CallableFunction
}

/** Base class for map contextmenus. By default it is empty and requires to be extended. */
export class ContextMenu {
    #container: HTMLElement | null;
    #latlng: LatLng = new LatLng(0, 0);
    #onBeforeShow: CallableFunction;
    #onShow: CallableFunction;
    #x: number = 0;
    #y: number = 0;
    #visibleSubMenu: string | null = null;

    /**
     * 
     * @param ID - the ID of the HTML element which will contain the context menu
     */
    constructor(config: contextMenuConfig) {
        this.#container = (config.id instanceof HTMLElement) ? config.id : document.getElementById(config.id);
        this.#onBeforeShow = config.onBeforeShow || function () { };
        this.#onShow = config.onShow || function () { };
        this.hide();

        if (typeof config.onInit === "function") config.onInit(this);
    }

    /** Show the contextmenu on top of the map, usually at the location where the user has clicked on it.
     * 
     * @param x X screen coordinate of the top left corner of the context menu. If undefined, use the old value
     * @param y Y screen coordinate of the top left corner of the context menu. If undefined, use the old value
     * @param latlng Leaflet latlng object of the mouse click. If undefined, use the old value
     */
    show(x: number | undefined = undefined, y: number | undefined = undefined, latlng: LatLng | undefined = undefined) {
        this.#onBeforeShow(this);
        this.#latlng = latlng ?? this.#latlng;
        this.#container?.classList.toggle("hide", false);
        this.#x = x ?? this.#x;
        this.#y = y ?? this.#y;
        this.clip();
        this.getContainer()?.dispatchEvent(new Event("show"));
        this.#onShow(this);
    }

    /** Hide the contextmenu
     * 
     */
    hide() {
        this.#container?.classList.toggle("hide", true);
        this.getContainer()?.dispatchEvent(new Event("hide"));
    }

    /**
     * 
     * @returns The HTMLElement that contains the contextmenu
     */
    getContainer() {
        return this.#container;
    }

    /**
     * 
     * @returns The Leaflet latlng object associated to the click that caused the contextmenu to be shown
     */
    getLatLng() {
        return this.#latlng;
    }

    /**
     * 
     * @returns The x coordinate of the top left corner of the menu
     */
    getX() {
        return this.#x;
    }

    /**
     * 
     * @returns The y coordinate of the top left corner of the menu
     */
    getY() {
        return this.#y;
    }

    /** Clips the contextmenu, meaning it moves it on the screen to make sure it does not overflow the window. 
     * 
     */
    clip() {
        if (this.#container != null) {
            if (this.#x + this.#container.offsetWidth < window.innerWidth)
                this.#container.style.left = this.#x + "px";
            else
                this.#container.style.left = window.innerWidth - this.#container.offsetWidth - 10 + "px";

            if (this.#y + this.#container.offsetHeight < window.innerHeight)
                this.#container.style.top = this.#y + "px";
            else
                this.#container.style.top = window.innerHeight - this.#container.offsetHeight - 10 + "px";
        }
    }

    /** Sets the currently visible submenu
     * 
     * @param menu The name of the currently visibile submenu, or null if no submenu is visible
     */
    setVisibleSubMenu(menu: string | null) {
        this.#visibleSubMenu = menu;
    }

    /**
     * 
     * @returns The name of the currently visible submenu
     */
    getVisibleSubMenu() {
        return this.#visibleSubMenu;
    }

    /** Toggles show/hide
     * 
     * @param x - see show()
     * @param y - see show()
     * @param latlng - see show()
     */
    toggle(x: number | undefined = undefined, y: number | undefined = undefined, latlng: LatLng | undefined = undefined) {
        (this.#container?.classList.contains("hide")) ? this.show(x, y, latlng) : this.hide();
    }
}