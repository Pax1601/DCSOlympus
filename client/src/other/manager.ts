export class Manager {

    #items: { [key: string]: any } = {};

    constructor() {

    }

    add(name: string, item: any) {
        const regex = new RegExp("^[a-z][a-z0-9]{2,}$", "i");
        if (regex.test(name) === false) {
            throw new Error(`Item name "${name}" does not match regex: ${regex.toString()}.`);
        }

        if (this.#items.hasOwnProperty(name)) {
            throw new Error(`Item with name "${name}" already exists.`);
        }

        this.#items[name] = item;
        return this;
    }

    get(name: string) {
        if (this.#items.hasOwnProperty(name)) {
            return this.#items[name];
        } else {
            return false;
        }
    }

    getAll() {
        return this.#items;
    }

}