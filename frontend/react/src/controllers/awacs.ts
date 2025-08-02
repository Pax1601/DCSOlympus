import { getApp } from "../olympusapp";
import { Coalition } from "../types/types";
import { Unit } from "../unit/unit";
import { bearing, coalitionToEnum, computeBearingRangeString, mToFt, rad2deg, spellNumbers } from "../other/utils";
import { Controller } from "./controller";

const trackStrings = ["North", "North-East", "East", "South-East", "South", "South-West", "West", "North-West", "North"];
const relTrackStrings = ["hot", "flank right", "beam right", "cold", "cold", "cold", "beam left", "flank left", "hot"];

export class AWACSController extends Controller {
  #coalition: Coalition = "blue";
  #callsign: string = "Magic";
  #referenceUnit: Unit;

  constructor(radioOptions: { frequency: number; modulation: number }, coalition: Coalition, callsign: string) {
    super(radioOptions);
    this.#coalition = coalition;
    this.#callsign = callsign;
  }

  parseText(text) {
    if (text.indexOf("request picture") > 0) {
      console.log("Requested AWACS picture");
      const readout = this.createPicture(true);
      this.playText(readout.reduce((acc, line) => (acc += " " + line), ""));
    } else if (text.indexOf("request bogey dope") > 0) {

    }
  }

  createPicture(forTextToSpeech: boolean = false, unitName?: string) {
    let readout: string[] = [];

    const mapOptions = getApp().getMap().getOptions();
    const activeGroups = Object.values(
      getApp()
        .getUnitsManager()
        .computeClusters((unit) => unit.getCoalition() !== mapOptions.AWACSCoalition, 6) ?? {}
    );
    const bullseyes = getApp().getMissionManager().getBullseyes();
    const referenceUnit: Unit | undefined = unitName ? undefined : this.#referenceUnit; //TODO

    if (bullseyes) {
      if (referenceUnit !== undefined) {
        readout.push(`${this.#callsign}, ${activeGroups.length} group${activeGroups.length > 1 ? "s" : ""}`);
        readout.push(
          ...activeGroups.map((group, idx) => {
            let order = "th";
            if (idx == 0) order = "st";
            else if (idx == 1) order = "nd";
            else if (idx == 2) order = "rd";

            let trackDegs =
              bearing(group[0].getPosition().lat, group[0].getPosition().lng, referenceUnit.getPosition().lat, referenceUnit.getPosition().lng, true) -
              rad2deg(group[0].getTrack());
            if (trackDegs < 0) trackDegs += 360;
            if (trackDegs > 360) trackDegs -= 360;
            let trackIndex = Math.round(trackDegs / 45);

            let groupLine = `${activeGroups.length > 1 ? idx + 1 + "" + order + " group" : "Single group"}.`;

            if (forTextToSpeech) {
              groupLine += `bullseye ${computeBearingRangeString(bullseyes[coalitionToEnum(mapOptions.AWACSCoalition)].getLatLng(), group[0].getPosition()).replace("/", ` <break time="0.5s"/> `)},`;
              groupLine += `${(mToFt(group[0].getPosition().alt ?? 0) / 1000).toFixed()} thousand, ${relTrackStrings[trackIndex]}`;
            } else {
              groupLine += `bullseye ${spellNumbers(computeBearingRangeString(bullseyes[coalitionToEnum(mapOptions.AWACSCoalition)].getLatLng(), group[0].getPosition()).replace("/", " "))},`;
              groupLine += `${(mToFt(group[0].getPosition().alt ?? 0) / 1000).toFixed()} thousand, ${relTrackStrings[trackIndex]}`;
            }

            if (group.find((unit) => unit.getCoalition() === "neutral")) groupLine += ", bogey.";
            else groupLine += ", hostile.";

            return groupLine + forTextToSpeech && `<break time="1s"/>`;
          })
        );
      } else {
        readout.push(`${this.#callsign}, ${activeGroups.length} group${activeGroups.length > 1 ? "s" : ""}.`);
        readout.push(
          ...activeGroups.map((group, idx) => {
            let order = "th";
            if (idx == 0) order = "st";
            else if (idx == 1) order = "nd";
            else if (idx == 2) order = "rd";

            let trackDegs = rad2deg(group[0].getTrack());
            if (trackDegs < 0) trackDegs += 360;
            let trackIndex = Math.round(trackDegs / 45);

            let groupLine = `${activeGroups.length > 1 ? idx + 1 + "" + order + " group" : "Single group"}.`;
            if (forTextToSpeech) {
              groupLine += `bullseye ${spellNumbers(computeBearingRangeString(bullseyes[coalitionToEnum(mapOptions.AWACSCoalition)].getLatLng(), group[0].getPosition()).replace("/", ` <break time="0.5s"/> `))},`;
              groupLine += `${(mToFt(group[0].getPosition().alt ?? 0) / 1000).toFixed()} thousand, track ${trackStrings[trackIndex]}`;
            } else {
              groupLine += `bullseye ${computeBearingRangeString(bullseyes[coalitionToEnum(mapOptions.AWACSCoalition)].getLatLng(), group[0].getPosition()).replace("/", " ")},`;
              groupLine += `${(mToFt(group[0].getPosition().alt ?? 0) / 1000).toFixed()} thousand, track ${trackStrings[trackIndex]}`;
            }

            if (group.find((unit) => unit.getCoalition() === "neutral")) groupLine += ", bogey.";
            else groupLine += ", hostile.";

            return groupLine + forTextToSpeech &&  `<break time="1s"/>`;
          })
        );
      }
    }

    return readout;
  }

  createBogeyDope(forTextToSpeech: boolean = false, unitName: string) {}

  setCallsign(callsign: string) {
    this.#callsign = callsign;
  }

  getCallsign() {
    return this.#callsign;
  }

  setCoalition(coalition: Coalition) {
    this.#coalition = coalition;
  }

  getCoalition() {
    return this.#coalition;
  }
}
