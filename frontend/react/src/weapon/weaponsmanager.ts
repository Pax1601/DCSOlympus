import { getApp } from "../olympusapp";
import { Weapon } from "./weapon";
import { DataIndexes } from "../constants/constants";
import { DataExtractor } from "../server/dataextractor";
import { Contact } from "../interfaces";

/** The WeaponsManager handles the creation and update of weapons. Data is strictly updated by the server ONLY. */
export class WeaponsManager {
  #weapons: { [ID: number]: Weapon };

  constructor() {
    this.#weapons = {};

    document.addEventListener("commandModeOptionsChanged", () => {
      Object.values(this.#weapons).forEach((weapon: Weapon) => weapon.updateVisibility());
    });
  }

  /**
   *
   * @returns All the existing weapons, both active and destroyed
   */
  getWeapons() {
    return this.#weapons;
  }

  /** Get a weapon by ID
   *
   * @param ID ID of the weapon
   * @returns Weapon object, or null if input ID does not exist
   */
  getWeaponByID(ID: number) {
    if (ID in this.#weapons) return this.#weapons[ID];
    else return null;
  }

  /** Add a new weapon to the manager
   *
   * @param ID ID of the new weapon
   * @param category Either "Missile" or "Bomb". Determines what class will be used to create the new unit accordingly.
   */
  addWeapon(ID: number, category: string) {
    if (category) {
      /* The name of the weapon category is exactly the same as the constructor name */
      var constructor = Weapon.getConstructor(category);
      if (constructor != undefined) {
        this.#weapons[ID] = new constructor(ID);
      }
    }
  }

  /** Update the data of all the weapons. The data is directly decoded from the binary buffer received from the REST Server. This is necessary for performance and bandwidth reasons.
   *
   * @param buffer The arraybuffer, encoded according to the ICD defined in: TODO Add reference to ICD
   * @returns The decoded updateTime of the data update.
   */
  update(buffer: ArrayBuffer) {
    /* Extract the data from the arraybuffer. Since data is encoded dynamically (not all data is always present, but rather only the data that was actually updated since the last request).
        No a prori casting can be performed. On the contrary, the array is decoded incrementally, depending on the DataIndexes of the data. The actual data decoding is performed by the Weapon class directly. 
        Every time a piece of data is decoded the decoder seeker is incremented. */
    var dataExtractor = new DataExtractor(buffer);

    var updateTime = Number(dataExtractor.extractUInt64());

    /* Run until all data is extracted or an error occurs */
    while (dataExtractor.getSeekPosition() < buffer.byteLength) {
      /* Extract the weapon ID */
      const ID = dataExtractor.extractUInt32();

      /* If the ID of the weapon does not yet exist, create the weapon, if the category is known. If it isn't, some data must have been lost and we need to wait for another update */
      if (!(ID in this.#weapons)) {
        const datumIndex = dataExtractor.extractUInt8();
        if (datumIndex == DataIndexes.category) {
          const category = dataExtractor.extractString();
          this.addWeapon(ID, category);
        } else {
          /* Inconsistent data, we need to wait for a refresh */
          return updateTime;
        }
      }
      /* Update the data of the weapon */
      this.#weapons[ID]?.setData(dataExtractor);
    }
    return updateTime;
  }

  /** For a given weapon, it returns if and how it is being detected by other units. NOTE: this function will return how a weapon is being detected, i.e. how other units are detecting it. It will not return
   * what the weapon is detecting (mostly because weapons can't detect units).
   *
   * @param weapon The unit of which to retrieve the "detected" methods.
   * @returns Array of detection methods
   */
  getWeaponDetectedMethods(weapon: Weapon) {
    var detectionMethods: number[] = [];
    var units = getApp().getUnitsManager().getUnits();
    for (let idx in units) {
      if (units[idx].getAlive() && units[idx].getIsLeader() && units[idx].getCoalition() !== "neutral" && units[idx].getCoalition() != weapon.getCoalition()) {
        units[idx].getContacts().forEach((contact: Contact) => {
          if (contact.ID == weapon.ID && !detectionMethods.includes(contact.detectionMethod)) detectionMethods.push(contact.detectionMethod);
        });
      }
    }
    return detectionMethods;
  }
}
