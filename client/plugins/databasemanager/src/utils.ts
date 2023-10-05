import { LoadoutBlueprint, LoadoutItemBlueprint, UnitBlueprint } from "interfaces";

/** This file contains a set of utility functions that are reused in the various editors and allows to declutter the classes
 * 
 */

/** Add a string input in the form of String: [ value ]
 * 
 * @param div The HTMLElement that will contain the input
 * @param key The key of the input, which will be used as label
 * @param value The initial value of the input
 * @param type The type of the input, e.g. "Text" or "Number" as per html standard
 * @param callback Callback called when the user enters a new value
 * @param disabled If true, the input will be disabled and read only
 */
export function addStringInput(div: HTMLElement, key: string, value: string, type: string, callback: CallableFunction, disabled?: boolean) {
    var row = document.createElement("div");
    var dt = document.createElement("dt");
    var dd = document.createElement("dd");
    dt.innerText = key;
    var input = document.createElement("input");
    input.value = value;
    input.textContent = value;
    input.type = type?? "text";
    input.disabled = disabled?? false;
    input.onchange = () => callback(input.value);
    dd.appendChild(input);
    row.appendChild(dt);
    row.appendChild(dd);
    row.classList.add("input-row");
    div.appendChild(row);
}

/** Add a dropdown (select) input
 * 
 * @param div The HTMLElement that will contain the input
 * @param key The key of the input, which will be used as label
 * @param value The initial value of the input
 * @param options The dropdown options
 */
export function addDropdownInput(div: HTMLElement, key: string, value: string, options: string[]) {
    var row = document.createElement("div");
    var dt = document.createElement("dt");
    var dd = document.createElement("dd");
    dt.innerText = key;
    var select = document.createElement("select");
    options.forEach((option: string) => {
        var el = document.createElement("option");
        el.value = option;
        el.innerText = option;
        select.appendChild(el);
    });
    select.value = value;
    dd.appendChild(select);
    row.appendChild(dt);
    row.appendChild(dd);
    row.classList.add("input-row");
    div.appendChild(row);
}

/** Create a loadout items editor. This editor allows to add or remove loadout items, as well as changing their name and quantity
 * 
 * @param div The HTMLElement that will contain the editor
 * @param loadout The loadout to edit
 */
export function addLoadoutItemsEditor(div: HTMLElement, loadout: LoadoutBlueprint) {
    var itemsEl = document.createElement("div");
    itemsEl.classList.add("dm-scroll-container", "dm-items-container");

    /* Create a row for each loadout item to allow and change the name and quantity of the item itself */
    loadout.items.sort((a: LoadoutItemBlueprint, b: LoadoutItemBlueprint) => a.name.localeCompare(b.name, undefined, {sensitivity: 'base'}));
    loadout.items.forEach((item: LoadoutItemBlueprint, index: number) => {
        var rowDiv = document.createElement("div");

        var nameLabel = document.createElement("label");
        nameLabel.innerText = "Name"
        rowDiv.appendChild(nameLabel);

        var nameInput = document.createElement("input");
        rowDiv.appendChild(nameInput);
        nameInput.textContent = item.name;
        nameInput.value = item.name
        nameInput.onchange = () => { loadout.items[index].name = nameInput.value; }

        var quantityLabel = document.createElement("label");
        quantityLabel.innerText = "Quantity"
        rowDiv.appendChild(quantityLabel);

        var quantityInput = document.createElement("input");
        rowDiv.appendChild(quantityInput);
        quantityInput.textContent = String(item.quantity);
        quantityInput.value = String(item.quantity);
        quantityInput.type = "number";
        quantityInput.step = "1";
        quantityInput.onchange = () => { loadout.items[index].quantity = parseInt(quantityInput.value); }

        /* This button allows to remove the item */
        var button = document.createElement("button");
        button.innerText = "X";
        button.onclick = () => {
            loadout.items.splice(index, 1);
            div.dispatchEvent(new Event("refresh"));
        }
        rowDiv.appendChild(button);

        itemsEl.appendChild(rowDiv);
    })
    div.appendChild(itemsEl);

    /* Button to add a new item to the loadout */
    var inputDiv = document.createElement("div");
    inputDiv.classList.add("dm-new-item-input");
    var button = document.createElement("button");
    button.innerText = "Add";
    inputDiv.appendChild(button);
    div.appendChild(inputDiv);

    button.addEventListener("click", (ev: MouseEvent) => {
        loadout?.items.push({
            name: "",
            quantity: 1
        })
        div.dispatchEvent(new Event("refresh"));
    });
}

/** Add a input and button to create a new element in a list. It uses a generic callback to actually add the element.
 * 
 * @param div The HTMLElement that will contain the input and button
 * @param callback Callback called when the user clicks on "Add"
 */
export function addNewElementInput(div: HTMLElement, callback: CallableFunction) {
    var inputDiv = document.createElement("div");
    inputDiv.classList.add("dm-new-element-input");

    var input = document.createElement("input");
    inputDiv.appendChild(input);

    var button = document.createElement("button");
    button.innerText = "Add";
    button.addEventListener("click", (ev: MouseEvent) => callback(ev, input));
    inputDiv.appendChild(button);
    div.appendChild(inputDiv);
}

/** Add a scrollable list of blueprints
 * 
 * @param div The HTMLElement that will contain the list
 * @param database The database that will be used to fill the list of blueprints
 * @param callback Callback called when the user clicks on one of the elements
 */
export function addBlueprintsScroll(div: HTMLElement, database: {blueprints: {[key: string]: UnitBlueprint}}, callback: CallableFunction) {
    var scrollDiv = document.createElement("div");
    scrollDiv.classList.add("dm-scroll-container");
    if (database !== null) {
        var blueprints: {[key: string]: UnitBlueprint} = database.blueprints;

        for (let key of Object.keys(blueprints).sort((a, b) => a.localeCompare(b, undefined, {sensitivity: 'base'}))) {
            var rowDiv = document.createElement("div");
            scrollDiv.appendChild(rowDiv);

            var text = document.createElement("label");
            text.textContent = key;
            text.onclick = () => callback(key);
            rowDiv.appendChild(text);

            /* This button allows to remove an element from the list. It requires a refresh. */
            var button = document.createElement("button");
            button.innerText = "X";
            button.onclick = () => {
                delete blueprints[key];
                div.dispatchEvent(new Event("refresh"));
            }
            rowDiv.appendChild(button);
        }      
    }
    div.appendChild(scrollDiv);
}

/** Add a scrollable list of loadouts
 * 
 * @param div The HTMLElement that will contain the list
 * @param loadouts The loadouts that will be used to fill the list
 * @param callback Callback called when the user clicks on one of the elements
 */
export function addLoadoutsScroll(div: HTMLElement, loadouts: LoadoutBlueprint[], callback: CallableFunction) {
    var loadoutsEl = document.createElement("div");
    loadoutsEl.classList.add("dm-scroll-container", "dm-loadout-container")
    
    loadouts.sort((a: LoadoutBlueprint, b: LoadoutBlueprint) => a.name.localeCompare(b.name, undefined, {sensitivity: 'base'}));
    loadouts.forEach((loadout: LoadoutBlueprint, index: number) => {
        var rowDiv = document.createElement("div");
        loadoutsEl.appendChild(rowDiv);

        var text = document.createElement("label");
        text.textContent = loadout.name;
        text.onclick = () => { callback(loadout) };
        rowDiv.appendChild(text);

        /* The "Empty loadout" can not be removed */
        if (loadout.name !== "Empty loadout") {
             /* This button allows to remove an element from the list. It requires a refresh. */
            var button = document.createElement("button");
            button.innerText = "X";
            button.onclick = () => {
                loadouts.splice(index, 1);
                div.dispatchEvent(new Event("refresh"));
            }
            rowDiv.appendChild(button);
        }
    });

    div.appendChild(loadoutsEl);
}