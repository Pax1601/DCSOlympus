import { getApp } from "../olympusapp";
import { BLUE_COMMANDER, RED_COMMANDER } from "../constants/constants";
import { CombatActor, CombatEvent, CombatEventType, CombatLogData, CombatScore } from "../interfaces";
import { CombatEventsReceivedEvent, MapOptionsChangedEvent } from "../events";
import { enumToCoalition } from "../other/utils";
import { Coalition } from "../types/types";
import { Unit } from "../unit/unit";
import { CombatMarker } from "../map/markers/combatmarker";
import { LatLng } from "leaflet";

const MAX_COMBAT_EVENTS = 5000;
/* The backend merges the hits less than 1 s apart, but only until it sends them, every 0.5 s: a longer burst arrives in several parts */
const BURST_MERGE_WINDOW = 1.5;
const MARKER_COLORS = { blue: "#3B82F6", red: "#EF4444", neutral: "#E5E7EB", all: "#E5E7EB" };
const EJECTION_MARKER_COLOR = "#67E8F9";

/* Stores the combat events (shots, hits, kills, ejections, takeoffs, landings...) received from the server, and computes the scores */
export class CombatLogManager {
  #events: CombatEvent[] = [];
  /* Last hit line of each shooter/target pair, to merge the bursts that the backend sends in several parts */
  #bursts: Map<string, { combatEvent: CombatEvent; lastSimTime: number }> = new Map();
  #lastLogTime: number = 0;
  #firstUpdate: boolean = true;
  #mockInterval: number | null = null;
  #markers: Set<CombatMarker> = new Set();

  constructor() {
    /* Show pulsing rings on the map where units are destroyed. Past events are not shown */
    CombatEventsReceivedEvent.on((combatEvents, history) => {
      if (!history) combatEvents.forEach((combatEvent) => this.#showMarker(combatEvent));
    });

    /* Remove the markers already shown when they are disabled */
    MapOptionsChangedEvent.on((mapOptions) => {
      if (mapOptions.showCombatMarkers) return;
      this.#markers.forEach((marker) => marker.removeFrom(getApp().getMap()));
      this.#markers.clear();
    });

    /* Fake combat events can be generated to work on the interface without DCS running, by opening Olympus with ?mockCombat=1 */
    if (new URLSearchParams(window.location.search).get("mockCombat") === "1") this.startMock();
  }

  /** Update the combat log with the data received from the server
   *
   * @param data Combat log data
   * @returns The time to use for the next request
   */
  update(data: CombatLogData) {
    /* Older backends do not support the combat log */
    if (!Array.isArray(data.combatLog)) return this.#lastLogTime;

    /* The first response contains what happened before the page was opened */
    this.#ingest(
      data.combatLog.filter((combatEvent) => combatEvent.logTime > this.#lastLogTime),
      this.#firstUpdate
    );
    this.#firstUpdate = false;
    this.#lastLogTime = Math.max(this.#lastLogTime, data.lastLogTime ?? 0);
    return this.#lastLogTime;
  }

  /** Get the combat events visible with the current command mode, oldest first */
  getEvents() {
    return this.#events.filter((combatEvent) => this.isVisible(combatEvent));
  }

  /** Commanders only see the events involving their own coalition. Other command modes see everything */
  isVisible(combatEvent: CombatEvent) {
    const commandMode = getApp().getMissionManager().getCommandModeOptions().commandMode;
    let coalitionID: number;
    if (commandMode === BLUE_COMMANDER) coalitionID = 2;
    else if (commandMode === RED_COMMANDER) coalitionID = 1;
    else return true;
    return combatEvent.initiator?.coalitionID === coalitionID || combatEvent.target?.coalitionID === coalitionID;
  }

  /** Get the coalition of an actor */
  getActorCoalition(actor?: CombatActor): Coalition {
    return (enumToCoalition(actor?.coalitionID ?? 0) || "neutral") as Coalition;
  }

  /** Get the display name of the type of an actor, e.g. "F-16C Viper" */
  getActorLabel(actor?: CombatActor) {
    if (actor?.typeName === undefined) return "Unknown";
    return getApp().getUnitsManager()?.getDatabase().getByName(actor.typeName)?.label ?? actor.typeName;
  }

  /** Get the display name of an actor: player name, else unit name */
  getActorName(actor?: CombatActor) {
    return actor?.playerName ?? actor?.unitName ?? this.getActorLabel(actor);
  }

  /** Get the image of an actor, from the units database */
  getActorImage(actor?: CombatActor) {
    if (actor?.typeName === undefined) return null;
    const filename = getApp().getUnitsManager()?.getDatabase().getByName(actor.typeName)?.filename;
    return filename ? `./images/units/${filename}` : null;
  }

  /** True if the actor is an airplane or an helicopter */
  isAirActor(actor?: CombatActor) {
    if (actor?.typeName === undefined) return false;
    const category = getApp().getUnitsManager()?.getDatabase().getByName(actor.typeName)?.category;
    return category === "aircraft" || category === "helicopter";
  }

  /** A unit destroyed by its own coalition, or by itself, is a loss but does not count as a kill in the scores */
  isFriendlyFire(combatEvent: CombatEvent) {
    const { initiator, target } = combatEvent;
    if (initiator === undefined || target === undefined) return false;
    if (initiator.ID !== undefined && initiator.ID === target.ID) return true;
    return (initiator.coalitionID ?? 0) !== 0 && initiator.coalitionID === target.coalitionID;
  }

  /** Get the scores of each actor that took part in the combat, best first */
  getScores() {
    const scores: { [key: string]: CombatScore } = {};
    const scoreOf = (actor: CombatActor) => {
      const key = actor.playerName ?? actor.unitName ?? `${actor.ID}`;
      if (!(key in scores))
        scores[key] = {
          key,
          name: this.getActorName(actor),
          typeName: actor.typeName,
          coalition: this.getActorCoalition(actor),
          isPlayer: actor.playerName !== undefined,
          shots: 0,
          hits: 0,
          kills: 0,
          airKills: 0,
          deaths: 0,
        };
      return scores[key];
    };

    for (const combatEvent of this.getEvents()) {
      const { initiator, target } = combatEvent;
      if (combatEvent.type === "shot" && initiator) scoreOf(initiator).shots++;
      else if (combatEvent.type === "hit" && initiator) scoreOf(initiator).hits++;
      else if (combatEvent.type === "kill") {
        if (initiator && !this.isFriendlyFire(combatEvent)) {
          scoreOf(initiator).kills++;
          if (this.isAirActor(target)) scoreOf(initiator).airKills++;
        }
        if (target) scoreOf(target).deaths++;
      } else if ((combatEvent.type === "dead" || combatEvent.type === "crash") && target) scoreOf(target).deaths++;
    }

    return Object.values(scores).sort((a, b) => b.kills - a.kills || a.deaths - b.deaths || b.hits - a.hits);
  }

  /** Get the number of kills and losses of each coalition */
  getCoalitionTotals() {
    const totals = { blue: { kills: 0, losses: 0 }, red: { kills: 0, losses: 0 }, neutral: { kills: 0, losses: 0 } };
    for (const combatEvent of this.getEvents()) {
      if (combatEvent.type !== "kill" && combatEvent.type !== "dead" && combatEvent.type !== "crash") continue;
      if (combatEvent.type === "kill" && combatEvent.initiator && !this.isFriendlyFire(combatEvent)) totals[this.getActorCoalition(combatEvent.initiator) as keyof typeof totals].kills++;
      if (combatEvent.target) totals[this.getActorCoalition(combatEvent.target) as keyof typeof totals].losses++;
    }
    return totals;
  }

  /** Start generating fake combat events, from the existing units if any, else from the units database */
  startMock() {
    if (this.#mockInterval !== null) return;
    console.warn("Combat log: generating fake combat events (mockCombat=1)");
    let seq = 0;

    /* Start with 20 minutes of history, so that the scores and the timeline are not empty */
    const missionTime = (getApp().getMissionManager()?.getDateAndTime().elapsedTime ?? 0) + 12 * 3600;
    const history: CombatEvent[] = [];
    for (let i = 0; i < 60; i++) history.push(...this.#generateMockEvents(++seq, missionTime - 1200 + i * 20, Date.now() - 60000 + i * 1000));
    this.#ingest(history, true);

    const tick = () => {
      this.#ingest(this.#generateMockEvents(++seq));
      this.#mockInterval = window.setTimeout(tick, 1000 + Math.random() * 2000);
    };
    this.#mockInterval = window.setTimeout(tick, 1000);
  }

  stopMock() {
    if (this.#mockInterval !== null) window.clearTimeout(this.#mockInterval);
    this.#mockInterval = null;
  }

  #showMarker(combatEvent: CombatEvent) {
    const map = getApp()?.getMap();
    if (combatEvent.position === undefined || map === undefined || !map.getOptions().showCombatMarkers) return;

    const latlng = new LatLng(combatEvent.position.lat, combatEvent.position.lng);
    let marker: CombatMarker;
    if (combatEvent.type === "kill") marker = new CombatMarker(latlng, MARKER_COLORS[this.getActorCoalition(combatEvent.initiator)]);
    else if (combatEvent.type === "dead" || combatEvent.type === "crash") marker = new CombatMarker(latlng, MARKER_COLORS.neutral);
    else if (combatEvent.type === "ejection") marker = new CombatMarker(latlng, EJECTION_MARKER_COLOR, 15);
    else return;

    marker.addTo(map);
    this.#markers.add(marker);
    marker.on("remove", () => this.#markers.delete(marker));
  }

  #ingest(combatEvents: CombatEvent[], history: boolean = false) {
    if (combatEvents.length === 0) return;

    const changedEvents: CombatEvent[] = [];
    for (const combatEvent of combatEvents) {
      const key = combatEvent.type === "hit" ? `${combatEvent.initiator?.ID}:${combatEvent.target?.ID}` : null;
      const burst = key !== null ? this.#bursts.get(key) : undefined;
      const index = burst ? this.#events.lastIndexOf(burst.combatEvent) : -1;

      if (burst && index >= 0 && combatEvent.simTime - burst.lastSimTime <= BURST_MERGE_WINDOW) {
        /* Same burst as the previous line: add the hits to it. The line is replaced, not modified, so that the panels notice the change */
        const merged = { ...burst.combatEvent, count: (burst.combatEvent.count ?? 1) + (combatEvent.count ?? 1) };
        this.#events[index] = merged;
        this.#bursts.set(key as string, { combatEvent: merged, lastSimTime: combatEvent.simTime });
        const changedIndex = changedEvents.indexOf(burst.combatEvent);
        if (changedIndex >= 0) changedEvents[changedIndex] = merged;
        else changedEvents.push(merged);
      } else {
        this.#events.push(combatEvent);
        changedEvents.push(combatEvent);
        if (key !== null) this.#bursts.set(key, { combatEvent, lastSimTime: combatEvent.simTime });
      }
    }
    if (this.#events.length > MAX_COMBAT_EVENTS) this.#events.splice(0, this.#events.length - MAX_COMBAT_EVENTS);

    const visibleEvents = changedEvents.filter((combatEvent) => this.isVisible(combatEvent));
    if (visibleEvents.length > 0) CombatEventsReceivedEvent.dispatch(visibleEvents, history);
  }

  #generateMockEvents(seq: number, absTime?: number, logTime?: number): CombatEvent[] {
    const actors = this.#getMockActors();
    const blue = actors.filter((actor) => actor.coalitionID === 2);
    const red = actors.filter((actor) => actor.coalitionID === 1);
    if (blue.length === 0 || red.length === 0) return [];

    const pick = <T,>(list: T[]) => list[Math.floor(Math.random() * list.length)];
    const blueShoots = Math.random() < 0.6;
    const initiator = pick(blueShoots ? blue : red);
    const target = pick(blueShoots ? red : blue);
    const weapons = this.isAirActor(initiator)
      ? blueShoots
        ? ["AIM_120C", "AIM_9X", "GBU_12", "AGM_114K", "M61_20_HE"]
        : ["R_77", "R_73", "KAB_500L", "GSh_30_1"]
      : blueShoots
        ? ["M830A1", "FIM_92C"]
        : ["SA9M38M1", "2A46M_125"];
    const weapon = pick(weapons);

    const now = logTime ?? Date.now();
    absTime = absTime ?? (getApp().getMissionManager()?.getDateAndTime().elapsedTime ?? 0) + 12 * 3600;
    const make = (offset: number, type: CombatEventType, initiatorActor?: CombatActor, targetActor?: CombatActor, extra: Partial<CombatEvent> = {}): CombatEvent => ({
      seq: seq * 10 + offset,
      logTime: now + offset,
      type,
      simTime: (absTime as number) - 12 * 3600,
      absTime: absTime as number,
      initiator: initiatorActor,
      target: targetActor,
      weapon: type === "shot" || type === "hit" || type === "kill" ? weapon : undefined,
      count: 1,
      position: (targetActor ?? initiatorActor)?.position,
      ...extra,
    });

    const roll = Math.random();
    if (roll < 0.15) return [make(0, Math.random() < 0.5 ? "takeoff" : "land", initiator, undefined, { place: pick(["Batumi", "Kutaisi", "Senaki-Kolkhi"]) })];
    if (roll < 0.35) return [make(0, "shot", initiator), make(1, "hit", initiator, target, { count: weapon === "M61_20_HE" ? 12 : 1 })];
    if (roll < 0.45) return [make(0, "ejection", target), make(1, "kill", initiator, target)];
    return [make(0, "shot", initiator), make(1, "kill", initiator, target)];
  }

  #getMockActors(): CombatActor[] {
    const units = Object.values(getApp().getUnitsManager()?.getUnits() ?? {}).filter(
      (unit: Unit) => unit.getAlive() && unit.getName() !== "" && (unit.getCoalition() === "blue" || unit.getCoalition() === "red")
    );
    const actors: CombatActor[] = units.map((unit: Unit) => ({
      ID: unit.ID,
      typeName: unit.getName(),
      unitName: unit.getUnitName(),
      groupName: unit.getGroupName(),
      callsign: unit.getCallsign(),
      coalitionID: unit.getCoalition() === "blue" ? 2 : unit.getCoalition() === "red" ? 1 : 0,
      position: { lat: unit.getPosition().lat, lng: unit.getPosition().lng, alt: unit.getPosition().alt ?? 0 },
    }));

    /* Complete the coalitions without units with a few well known types from the database, around the existing units or the center of the map */
    const coalitionsWithUnits = new Set(actors.map((actor) => actor.coalitionID));
    const mapCenter = getApp().getMap()?.getCenter();
    const center = actors[0]?.position ?? (mapCenter ? { lat: mapCenter.lat, lng: mapCenter.lng, alt: 0 } : { lat: 41.6, lng: 41.6, alt: 0 });
    const types: [string, number, string?][] = [
      ["F-16C_50", 2, "Maverick"],
      ["FA-18C_hornet", 2, "Goose"],
      ["AH-64D_BLK_II", 2],
      ["MiG-29A", 1],
      ["Su-27", 1],
      ["T-72B", 1],
      ["SA-11 Buk LN 9A310M1", 1],
    ];
    types.forEach(([typeName, coalitionID, playerName], idx) => {
      if (coalitionsWithUnits.has(coalitionID)) return;
      actors.push({
        ID: -1 - idx /* Negative IDs never match an existing unit */,
        typeName,
        unitName: `${typeName}-${idx + 1}`,
        playerName,
        coalitionID,
        position: { lat: center.lat + (Math.random() - 0.5) * 0.1, lng: center.lng + (Math.random() - 0.5) * 0.15, alt: 1000 },
      });
    });
    return actors;
  }
}
