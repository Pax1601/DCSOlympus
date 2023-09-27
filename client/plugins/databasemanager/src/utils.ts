import { LoadoutBlueprint, LoadoutItemBlueprint, UnitBlueprint } from "interfaces";

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

export function addLoadoutItemsEditor(div: HTMLElement, loadout: LoadoutBlueprint) {
    var itemsEl = document.createElement("div");
    itemsEl.classList.add("dm-scroll-container", "dm-items-container");
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

export function addBlueprintsScroll(div: HTMLElement, database: {blueprints: {[key: string]: UnitBlueprint}}, callback: CallableFunction) {
    var scrollDiv = document.createElement("div");
    scrollDiv.classList.add("dm-scroll-container");
    if (database !== null) {
        var blueprints: {[key: string]: UnitBlueprint} = database.blueprints;

        for (let key in blueprints) {
            var rowDiv = document.createElement("div");
            scrollDiv.appendChild(rowDiv);

            var text = document.createElement("label");
            text.textContent = key;
            text.onclick = () => callback(key);
            rowDiv.appendChild(text);

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

export function addLoadoutsScroll(div: HTMLElement, loadouts: LoadoutBlueprint[], callback: CallableFunction) {
    var loadoutsEl = document.createElement("div");
    loadoutsEl.classList.add("dm-scroll-container", "dm-loadout-container")
    
    loadouts.forEach((loadout: LoadoutBlueprint, index: number) => {
        var rowDiv = document.createElement("div");
        loadoutsEl.appendChild(rowDiv);

        var text = document.createElement("label");
        text.textContent = loadout.name;
        text.onclick = () => { callback(loadout) };
        rowDiv.appendChild(text);

        if (loadout.name !== "Empty loadout") {
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