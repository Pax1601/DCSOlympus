import { AudioSink } from "./audio/audiosink";
import { AudioSource } from "./audio/audiosource";
import { OlympusState, OlympusSubState } from "./constants/constants";
import { CommandModeOptions, OlympusConfig, ServerStatus, SpawnRequestTable } from "./interfaces";
import { CoalitionCircle } from "./map/coalitionarea/coalitioncircle";
import { CoalitionPolygon } from "./map/coalitionarea/coalitionpolygon";
import { Airbase } from "./mission/airbase";
import { Bullseye } from "./mission/bullseye";
import { Shortcut } from "./shortcut/shortcut";
import { MapHiddenTypes, MapOptions } from "./types/types";
import { ContextAction } from "./unit/contextaction";
import { ContextActionSet } from "./unit/contextactionset";
import { Unit } from "./unit/unit";
import { LatLng } from "leaflet";

export class BaseOlympusEvent {
  static on(callback: () => void) {
    document.addEventListener(this.name, (ev: CustomEventInit) => {
      callback();
    });
  }

  static dispatch() {
    document.dispatchEvent(new CustomEvent(this.name));
    console.log(`Event ${this.name} dispatched`);
  }
}

export class BaseUnitEvent {
  static on(callback: (unit: Unit) => void) {
    document.addEventListener(this.name, (ev: CustomEventInit) => {
      callback(ev.detail.unit);
    });
  }

  static dispatch(unit: Unit) {
    document.dispatchEvent(new CustomEvent(this.name, { detail: { unit } }));
    console.log(`Event ${this.name} dispatched`);
    console.log(unit);
  }
}

/************** App events ***************/
export class AppStateChangedEvent {
  static on(callback: (state: OlympusState, subState: OlympusSubState) => void) {
    document.addEventListener(this.name, (ev: CustomEventInit) => {
      callback(ev.detail.state, ev.detail.subState);
    });
  }

  static dispatch(state: OlympusState, subState: OlympusSubState) {
    const detail = { state, subState };
    document.dispatchEvent(new CustomEvent(this.name, { detail }));
    console.log(`Event ${this.name} dispatched`);
    console.log(`State: ${state} Substate: ${subState}`);
  }
}

export class ConfigLoadedEvent {
  static on(callback: (config: OlympusConfig) => void) {
    document.addEventListener(this.name, (ev: CustomEventInit) => {
      callback(ev.detail);
    });
  }

  static dispatch(config: OlympusConfig) {
    document.dispatchEvent(new CustomEvent(this.name, { detail: config }));
    console.log(`Event ${this.name} dispatched`);
    console.log(config);
  }
}

export class ServerStatusUpdatedEvent {
  static on(callback: (serverStatus: ServerStatus) => void) {
    document.addEventListener(this.name, (ev: CustomEventInit) => {
      callback(ev.detail.serverStatus);
    });
  }

  static dispatch(serverStatus: ServerStatus) {
    document.dispatchEvent(new CustomEvent(this.name, { detail: { serverStatus } }));
    // Logging disabled since periodic
  }
}

export class UnitDatabaseLoadedEvent extends BaseOlympusEvent {}

export class InfoPopupEvent {
  static on(callback: (messages: string[]) => void) {
    document.addEventListener(this.name, (ev: CustomEventInit) => {
      callback(ev.detail.messages);
    });
  }

  static dispatch(messages: string[]) {
    document.dispatchEvent(new CustomEvent(this.name, { detail: { messages } }));
    console.log(`Event ${this.name} dispatched`);
  }
}

export class HideMenuEvent {
  static on(callback: (hidden: boolean) => void) {
    document.addEventListener(this.name, (ev: CustomEventInit) => {
      callback(ev.detail.hidden);
    });
  }

  static dispatch(hidden: boolean) {
    document.dispatchEvent(new CustomEvent(this.name, { detail: { hidden } }));
    console.log(`Event ${this.name} dispatched`);
  }
}

export class ShortcutsChangedEvent {
  static on(callback: (shortcuts: { [key: string]: Shortcut }) => void) {
    document.addEventListener(this.name, (ev: CustomEventInit) => {
      callback(ev.detail.shortcuts);
    });
  }

  static dispatch(shortcuts: { [key: string]: Shortcut }) {
    document.dispatchEvent(new CustomEvent(this.name, { detail: { shortcuts } }));
    console.log(`Event ${this.name} dispatched`);
  }
}

export class ShortcutChangedEvent {
  static on(callback: (shortcut: Shortcut) => void) {
    document.addEventListener(this.name, (ev: CustomEventInit) => {
      callback(ev.detail.shortcut);
    });
  }

  static dispatch(shortcut: Shortcut) {
    document.dispatchEvent(new CustomEvent(this.name, { detail: { shortcut } }));
    console.log(`Event ${this.name} dispatched`);
  }
}

export class BindShortcutRequestEvent {
  static on(callback: (shortcut: Shortcut) => void) {
    document.addEventListener(this.name, (ev: CustomEventInit) => {
      callback(ev.detail.shortcut);
    });
  }

  static dispatch(shortcut: Shortcut) {
    document.dispatchEvent(new CustomEvent(this.name, { detail: { shortcut } }));
    console.log(`Event ${this.name} dispatched`);
  }
}

/************** Map events ***************/
export class HiddenTypesChangedEvent {
  static on(callback: (hiddenTypes: MapHiddenTypes) => void) {
    document.addEventListener(this.name, (ev: CustomEventInit) => {
      callback(ev.detail.hiddenTypes);
    });
  }

  static dispatch(hiddenTypes: MapHiddenTypes) {
    document.dispatchEvent(new CustomEvent(this.name, { detail: { hiddenTypes } }));
    console.log(`Event ${this.name} dispatched`);
  }
}

export class MapOptionsChangedEvent {
  static on(callback: (mapOptions: MapOptions) => void) {
    document.addEventListener(this.name, (ev: CustomEventInit) => {
      callback(ev.detail.mapOptions);
    });
  }

  static dispatch(mapOptions: MapOptions) {
    document.dispatchEvent(new CustomEvent(this.name, { detail: { mapOptions } }));
    console.log(`Event ${this.name} dispatched`);
  }
}

export class MapSourceChangedEvent {
  static on(callback: (source: string) => void) {
    document.addEventListener(this.name, (ev: CustomEventInit) => {
      callback(ev.detail.source);
    });
  }

  static dispatch(source: string) {
    document.dispatchEvent(new CustomEvent(this.name, { detail: { source } }));
    console.log(`Event ${this.name} dispatched`);
  }
}

export class CoalitionAreaSelectedEvent {
  static on(callback: (coalitionArea: CoalitionCircle | CoalitionPolygon | null) => void) {
    document.addEventListener(this.name, (ev: CustomEventInit) => {
      callback(ev.detail.coalitionArea);
    });
  }

  static dispatch(coalitionArea: CoalitionCircle | CoalitionPolygon | null) {
    document.dispatchEvent(new CustomEvent(this.name, { detail: { coalitionArea } }));
    console.log(`Event ${this.name} dispatched`);
  }
}

export class AirbaseSelectedEvent {
  static on(callback: (airbase: Airbase | null) => void) {
    document.addEventListener(this.name, (ev: CustomEventInit) => {
      callback(ev.detail.airbase);
    });
  }

  static dispatch(airbase: Airbase | null) {
    document.dispatchEvent(new CustomEvent(this.name, { detail: { airbase } }));
    console.log(`Event ${this.name} dispatched`);
  }
}

export class ContactsUpdatedEvent {
  static on(callback: () => void) {
    document.addEventListener(this.name, (ev: CustomEventInit) => {
      callback();
    });
  }

  static dispatch() {
    document.dispatchEvent(new CustomEvent(this.name));
    // Logging disabled since periodic
  }
}

export class ContextActionSetChangedEvent {
  static on(callback: (contextActionSet: ContextActionSet | null) => void) {
    document.addEventListener(this.name, (ev: CustomEventInit) => {
      callback(ev.detail.contextActionSet);
    });
  }

  static dispatch(contextActionSet: ContextActionSet | null) {
    document.dispatchEvent(new CustomEvent(this.name, { detail: { contextActionSet } }));
    console.log(`Event ${this.name} dispatched`);
  }
}

export class ContextActionChangedEvent {
  static on(callback: (contextAction: ContextAction | null) => void) {
    document.addEventListener(this.name, (ev: CustomEventInit) => {
      callback(ev.detail.contextAction);
    });
  }

  static dispatch(contextAction: ContextAction | null) {
    document.dispatchEvent(new CustomEvent(this.name, { detail: { contextAction } }));
    console.log(`Event ${this.name} dispatched`);
  }
}

export class UnitUpdatedEvent extends BaseUnitEvent {
  static dispatch(unit: Unit) {
    document.dispatchEvent(new CustomEvent(this.name, { detail: { unit } }));
    // Logging disabled since periodic
  }
}
export class UnitSelectedEvent extends BaseUnitEvent {}
export class UnitDeselectedEvent extends BaseUnitEvent {}
export class UnitDeadEvent extends BaseUnitEvent {}
export class SelectionClearedEvent extends BaseOlympusEvent {}

export class SelectedUnitsChangedEvent {
  static on(callback: (selectedUnits: Unit[]) => void) {
    document.addEventListener(this.name, (ev: CustomEventInit) => {
      callback(ev.detail);
    });
  }

  static dispatch(selectedUnits: Unit[]) {
    document.dispatchEvent(new CustomEvent(this.name, { detail: selectedUnits }));
    console.log(`Event ${this.name} dispatched`);
    console.log(selectedUnits);
  }
}

export class UnitExplosionRequestEvent {
  static on(callback: (units: Unit[]) => void) {
    document.addEventListener(this.name, (ev: CustomEventInit) => {
      callback(ev.detail.units);
    });
  }

  static dispatch(units: Unit[]) {
    document.dispatchEvent(new CustomEvent(this.name, { detail: { units } }));
    console.log(`Event ${this.name} dispatched`);
  }
}

export class FormationCreationRequestEvent {
  static on(callback: (leader: Unit, wingmen: Unit[]) => void) {
    document.addEventListener(this.name, (ev: CustomEventInit) => {
      callback(ev.detail.leader, ev.detail.wingmen);
    });
  }

  static dispatch(leader: Unit, wingmen: Unit[]) {
    document.dispatchEvent(new CustomEvent(this.name, { detail: { leader, wingmen } }));
    console.log(`Event ${this.name} dispatched`);
  }
}

export class MapContextMenuRequestEvent {
  static on(callback: (latlng: L.LatLng) => void) {
    document.addEventListener(this.name, (ev: CustomEventInit) => {
      callback(ev.detail.latlng);
    });
  }

  static dispatch(latlng: L.LatLng) {
    document.dispatchEvent(new CustomEvent(this.name, { detail: { latlng } }));
    console.log(`Event ${this.name} dispatched`);
  }
}

export class UnitContextMenuRequestEvent {
  static on(callback: (unit: Unit) => void) {
    document.addEventListener(this.name, (ev: CustomEventInit) => {
      callback(ev.detail.unit);
    });
  }

  static dispatch(unit: Unit) {
    document.dispatchEvent(new CustomEvent(this.name, { detail: { unit } }));
    console.log(`Event ${this.name} dispatched`);
  }
}

export class StarredSpawnContextMenuRequestEvent {
  static on(callback: (latlng: L.LatLng) => void) {
    document.addEventListener(this.name, (ev: CustomEventInit) => {
      callback(ev.detail.latlng);
    });
  }

  static dispatch(latlng: L.LatLng) {
    document.dispatchEvent(new CustomEvent(this.name, { detail: { latlng } }));
    console.log(`Event ${this.name} dispatched`);
  }
}

export class HotgroupsChangedEvent {
  static on(callback: (hotgroups: { [key: number]: number }) => void) {
    document.addEventListener(this.name, (ev: CustomEventInit) => {
      callback(ev.detail.hotgroups);
    });
  }

  static dispatch(hotgroups: { [key: number]: number }) {
    document.dispatchEvent(new CustomEvent(this.name, { detail: { hotgroups } }));
    console.log(`Event ${this.name} dispatched`);
  }
}

export class StarredSpawnsChangedEvent {
  static on(callback: (starredSpawns: { [key: number]: SpawnRequestTable }) => void) {
    document.addEventListener(this.name, (ev: CustomEventInit) => {
      callback(ev.detail.starredSpawns);
    });
  }

  static dispatch(starredSpawns: { [key: number]: SpawnRequestTable }) {
    document.dispatchEvent(new CustomEvent(this.name, { detail: { starredSpawns } }));
    console.log(`Event ${this.name} dispatched`);
  }
}

export class MouseMovedEvent {
  static on(callback: (latlng: LatLng, elevation: number) => void) {
    document.addEventListener(this.name, (ev: CustomEventInit) => {
      callback(ev.detail.latlng, ev.detail.elevation);
    });
  }

  static dispatch(latlng: LatLng, elevation?: number) {
    document.dispatchEvent(new CustomEvent(this.name, { detail: { latlng, elevation } }));
    console.log(`Event ${this.name} dispatched`);
  }
}

/************** Command mode events ***************/
export class CommandModeOptionsChangedEvent {
  static on(callback: (options: CommandModeOptions) => void) {
    document.addEventListener(this.name, (ev: CustomEventInit) => {
      callback(ev.detail);
    });
  }

  static dispatch(options: CommandModeOptions) {
    document.dispatchEvent(new CustomEvent(this.name, { detail: options }));
    console.log(`Event ${this.name} dispatched`);
  }
}

/************** Audio backend events ***************/
export class AudioSourcesChangedEvent {
  static on(callback: (audioSources: AudioSource[]) => void) {
    document.addEventListener(this.name, (ev: CustomEventInit) => {
      callback(ev.detail);
    });
  }

  static dispatch(audioSources: AudioSource[]) {
    document.dispatchEvent(new CustomEvent(this.name, { detail: { audioSources } }));
    console.log(`Event ${this.name} dispatched`);
    console.log(audioSources);
  }
}

export class AudioSinksChangedEvent {
  static on(callback: (audioSinks: AudioSink[]) => void) {
    document.addEventListener(this.name, (ev: CustomEventInit) => {
      callback(ev.detail);
    });
  }

  static dispatch(audioSinks: AudioSink[]) {
    document.dispatchEvent(new CustomEvent(this.name, { detail: { audioSinks } }));
    console.log(`Event ${this.name} dispatched`);
    console.log(audioSinks);
  }
}

export class SRSClientsChangedEvent {
  static on(callback: () => void) {
    document.addEventListener(this.name, (ev: CustomEventInit) => {
      callback();
    });
  }

  static dispatch() {
    document.dispatchEvent(new CustomEvent(this.name));
    // Logging disabled since periodic
  }
}

export class AudioManagerStateChangedEvent {
  static on(callback: (state: boolean) => void) {
    document.addEventListener(this.name, (ev: CustomEventInit) => {
      callback(ev.detail.state);
    });
  }

  static dispatch(state: boolean) {
    document.dispatchEvent(new CustomEvent(this.name, { detail: { state } }));
    console.log(`Event ${this.name} dispatched`);
  }
}

/************** Mission data events ***************/
export class BullseyesDataChanged {
  static on(callback: (bullseyes: { [name: string]: Bullseye }) => void) {
    document.addEventListener(this.name, (ev: CustomEventInit) => {
      callback(ev.detail.bullseyes);
    });
  }

  static dispatch(bullseyes: { [name: string]: Bullseye } ) {
    document.dispatchEvent(new CustomEvent(this.name, { detail: { bullseyes } }));
    console.log(`Event ${this.name} dispatched`);
  }
}
