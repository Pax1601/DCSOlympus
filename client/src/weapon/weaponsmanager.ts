import { getMissionHandler, getUnitsManager } from "..";
import { Weapon } from "./weapon";
import { DataIndexes, GAME_MASTER } from "../constants/constants";
import { DataExtractor } from "../server/dataextractor";
import { Contact } from "../@types/unit";

export class WeaponsManager {
    #weapons: { [ID: number]: Weapon };
    #requestDetectionUpdate: boolean = false;

    constructor() {
        this.#weapons = {};

        document.addEventListener("commandModeOptionsChanged", () => {Object.values(this.#weapons).forEach((weapon: Weapon) => weapon.updateVisibility())});
        document.addEventListener('contactsUpdated', (e: CustomEvent) => {this.#requestDetectionUpdate = true});
    }

    getWeapons() {
        return this.#weapons;
    }

    getWeaponByID(ID: number) {
        if (ID in this.#weapons)
            return this.#weapons[ID];
        else
            return null;
    }

    addWeapon(ID: number, category: string) {
        if (category){
            /* The name of the weapon category is exactly the same as the constructor name */
            var constructor = Weapon.getConstructor(category);
            if (constructor != undefined) {
                this.#weapons[ID] = new constructor(ID);
            }
        }
    }

    update(buffer: ArrayBuffer) {
        var dataExtractor = new DataExtractor(buffer);
        var updateTime = Number(dataExtractor.extractUInt64());
        while (dataExtractor.getSeekPosition() < buffer.byteLength) {
            const ID = dataExtractor.extractUInt32();
            if (!(ID in this.#weapons)) {
                const datumIndex = dataExtractor.extractUInt8();
                if (datumIndex == DataIndexes.category) {
                    const category = dataExtractor.extractString();
                    this.addWeapon(ID, category);
                }
                else {
                    /* Inconsistent data, we need to wait for a refresh */
                    return updateTime;
                }
            }
            this.#weapons[ID]?.setData(dataExtractor);
        }

        if (this.#requestDetectionUpdate && getMissionHandler().getCommandModeOptions().commandMode != GAME_MASTER) {
            for (let ID in this.#weapons) {
                var weapon = this.#weapons[ID];
                if (!weapon.belongsToCommandedCoalition())
                    weapon.setDetectionMethods(this.getWeaponDetectedMethods(weapon));
            }
            this.#requestDetectionUpdate = false;
        }

        return updateTime;
    }

    getWeaponDetectedMethods(weapon: Weapon) {
        var detectionMethods: number[] = [];
        var units = getUnitsManager().getUnits();
        for (let idx in units) {
            if (units[idx].getAlive() && units[idx].getIsLeader() && units[idx].getCoalition() !== "neutral" && units[idx].getCoalition() != weapon.getCoalition())
            {
                units[idx].getContacts().forEach((contact: Contact) => {
                    if (contact.ID == weapon.ID && !detectionMethods.includes(contact.detectionMethod)) 
                        detectionMethods.push(contact.detectionMethod);
                });
            }
        }
        return detectionMethods;
    }
}