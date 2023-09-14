import { LatLng } from "leaflet";

/** Base class for map contextmenus. By default it is empty and requires to be extended. */
export class ContextMenu {
    #container: HTMLElement | null;
    #latlng: LatLng = new LatLng(0, 0);
    #x: number = 0;
    #y: number = 0;
    #visibleSubMenu: string | null = null;

    /**
     * 
     * @param ID - the ID of the HTML element which will contain the context menu
     */
    constructor(ID: string){
        this.#container = document.getElementById(ID);
        this.hide();
    }

    /** Show the contextmenu on top of the map, usually at the location where the user has clicked on it.
     * 
     * @param x X screen coordinate of the top left corner of the context menu
     * @param y Y screen coordinate of the top left corner of the context menu
     * @param latlng Leaflet latlng object of the mouse click
     */
    show(x: number, y: number, latlng: LatLng) {
        this.#latlng = latlng;
        this.#container?.classList.toggle("hide", false);
        this.#x = x;
        this.#y = y;
        this.clip();
    }

    /** Hide the contextmenu
     * 
     */
    hide() {
        this.#container?.classList.toggle("hide", true);
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
}