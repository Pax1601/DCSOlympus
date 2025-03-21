import { AudioSink } from "./audio/audiosink";
import { AudioSource } from "./audio/audiosource";
import { OlympusState, OlympusSubState } from "./constants/constants";
import { CommandModeOptions, MissionData, OlympusConfig, ServerStatus, SessionData, SpawnRequestTable, UnitData } from "./interfaces";
import { CoalitionCircle } from "./map/coalitionarea/coalitioncircle";
import { CoalitionPolygon } from "./map/coalitionarea/coalitionpolygon";
import { Airbase } from "./mission/airbase";
import { Bullseye } from "./mission/bullseye";
import { Shortcut } from "./shortcut/shortcut";
import { Coalition, MapHiddenTypes, MapOptions } from "./types/types";
import { ContextAction } from "./unit/contextaction";
import { ContextActionSet } from "./unit/contextactionset";
import { Unit } from "./unit/unit";
import { LatLng } from "leaflet";
import { Weapon } from "./weapon/weapon";

export class BaseOlympusEvent {
  static on(callback: () => void, singleShot = false) {
    document.addEventListener(
      this.name,
      (ev: CustomEventInit) => {
        callback();
      },
      { once: singleShot }
    );
  }

  static dispatch() {
    document.dispatchEvent(new CustomEvent(this.name));
    console.log(`Event ${this.name} dispatched`);
  }
}

export class BaseUnitEvent {
  static on(callback: (unit: Unit) => void, singleShot = false) {
    document.addEventListener(
      this.name,
      (ev: CustomEventInit) => {
        callback(ev.detail.unit);
      },
      { once: singleShot }
    );
  }

  static dispatch(unit: Unit) {
    document.dispatchEvent(new CustomEvent(this.name, { detail: { unit } }));
    console.log(`Event ${this.name} dispatched`);
    console.log(unit);
  }
}

export class BaseUnitsEvent {
  static on(callback: (selectedUnits: Unit[]) => void, singleShot = false) {
    document.addEventListener(
      this.name,
      (ev: CustomEventInit) => {
        callback(ev.detail);
      },
      { once: singleShot }
    );
  }

  static dispatch(units: Unit[]) {
    document.dispatchEvent(new CustomEvent(this.name, { detail: units }));
    console.log(`Event ${this.name} dispatched`);
  }
}

/************** App events ***************/
export class AppStateChangedEvent {
  static on(callback: (state: OlympusState, subState: OlympusSubState) => void, singleShot = false) {
    document.addEventListener(
      this.name,
      (ev: CustomEventInit) => {
        callback(ev.detail.state, ev.detail.subState);
      },
      { once: singleShot }
    );
  }

  static dispatch(state: OlympusState, subState: OlympusSubState) {
    const detail = { state, subState };
    document.dispatchEvent(new CustomEvent(this.name, { detail }));
    console.log(`Event ${this.name} dispatched`);
    console.log(`State: ${state} Substate: ${subState}`);
  }
}

export class ConfigLoadedEvent {
  static on(callback: (config: OlympusConfig) => void, singleShot = false) {
    document.addEventListener(
      this.name,
      (ev: CustomEventInit) => {
        callback(ev.detail);
      },
      { once: singleShot }
    );
  }

  static dispatch(config: OlympusConfig) {
    document.dispatchEvent(new CustomEvent(this.name, { detail: config }));
    console.log(`Event ${this.name} dispatched`);
    console.log(config);
  }
}

export class ServerStatusUpdatedEvent {
  static on(callback: (serverStatus: ServerStatus) => void, singleShot = false) {
    document.addEventListener(
      this.name,
      (ev: CustomEventInit) => {
        callback(ev.detail.serverStatus);
      },
      { once: singleShot }
    );
  }

  static dispatch(serverStatus: ServerStatus) {
    document.dispatchEvent(new CustomEvent(this.name, { detail: { serverStatus } }));
    // Logging disabled since periodic
  }
}

export class UnitDatabaseLoadedEvent extends BaseOlympusEvent {}

export class InfoPopupEvent {
  static on(callback: (messages: string[]) => void, singleShot = false) {
    document.addEventListener(
      this.name,
      (ev: CustomEventInit) => {
        callback(ev.detail.messages);
      },
      { once: singleShot }
    );
  }

  static dispatch(messages: string[]) {
    document.dispatchEvent(new CustomEvent(this.name, { detail: { messages } }));
    console.log(`Event ${this.name} dispatched`);
  }
}

export class WrongCredentialsEvent extends BaseOlympusEvent {}

export class ShortcutsChangedEvent {
  static on(callback: (shortcuts: { [key: string]: Shortcut }) => void, singleShot = false) {
    document.addEventListener(
      this.name,
      (ev: CustomEventInit) => {
        callback(ev.detail.shortcuts);
      },
      { once: singleShot }
    );
  }

  static dispatch(shortcuts: { [key: string]: Shortcut }) {
    document.dispatchEvent(new CustomEvent(this.name, { detail: { shortcuts } }));
    console.log(`Event ${this.name} dispatched`);
  }
}

export class ShortcutChangedEvent {
  static on(callback: (shortcut: Shortcut) => void, singleShot = false) {
    document.addEventListener(
      this.name,
      (ev: CustomEventInit) => {
        callback(ev.detail.shortcut);
      },
      { once: singleShot }
    );
  }

  static dispatch(shortcut: Shortcut) {
    document.dispatchEvent(new CustomEvent(this.name, { detail: { shortcut } }));
    console.log(`Event ${this.name} dispatched`);
  }
}

export class BindShortcutRequestEvent {
  static on(callback: (shortcut: Shortcut) => void, singleShot = false) {
    document.addEventListener(
      this.name,
      (ev: CustomEventInit) => {
        callback(ev.detail.shortcut);
      },
      { once: singleShot }
    );
  }

  static dispatch(shortcut: Shortcut) {
    document.dispatchEvent(new CustomEvent(this.name, { detail: { shortcut } }));
    console.log(`Event ${this.name} dispatched`);
  }
}

export class ModalEvent {
  static on(callback: (modal: boolean) => void, singleShot = false) {
    document.addEventListener(
      this.name,
      (ev: CustomEventInit) => {
        callback(ev.detail.modal);
      },
      { once: singleShot }
    );
  }

  static dispatch(modal: boolean) {
    document.dispatchEvent(new CustomEvent(this.name, { detail: { modal } }));
    console.log(`Event ${this.name} dispatched`);
  }
}

export class SessionDataChangedEvent {
  static on(callback: (sessionData: SessionData) => void, singleShot = false) {
    document.addEventListener(
      this.name,
      (ev: CustomEventInit) => {
        callback(ev.detail.sessionData);
      },
      { once: singleShot }
    );
  }

  static dispatch(sessionData: SessionData) {
    document.dispatchEvent(new CustomEvent(this.name, { detail: { sessionData } }));
    console.log(`Event ${this.name} dispatched`);
  }
}

export class SessionDataSavedEvent extends SessionDataChangedEvent {}
export class SessionDataLoadedEvent extends SessionDataChangedEvent {}

export class AdminPasswordChangedEvent {
  static on(callback: (password: string) => void, singleShot = false) {
    document.addEventListener(
      this.name,
      (ev: CustomEventInit) => {
        callback(ev.detail.password);
      },
      { once: singleShot }
    );
  }

  static dispatch(password: string) {
    document.dispatchEvent(new CustomEvent(this.name, { detail: { password } }));
    console.log(`Event ${this.name} dispatched`);
  }
}

/************** Map events ***************/
export class MouseMovedEvent {
  static on(callback: (latlng: LatLng, elevation: number) => void, singleShot = false) {
    document.addEventListener(
      this.name,
      (ev: CustomEventInit) => {
        callback(ev.detail.latlng, ev.detail.elevation);
      },
      { once: singleShot }
    );
  }

  static dispatch(latlng: LatLng, elevation?: number) {
    document.dispatchEvent(new CustomEvent(this.name, { detail: { latlng, elevation } }));
    // Logging disabled since periodic
  }
}

export class HiddenTypesChangedEvent {
  static on(callback: (hiddenTypes: MapHiddenTypes) => void, singleShot = false) {
    document.addEventListener(
      this.name,
      (ev: CustomEventInit) => {
        callback(ev.detail.hiddenTypes);
      },
      { once: singleShot }
    );
  }

  static dispatch(hiddenTypes: MapHiddenTypes) {
    document.dispatchEvent(new CustomEvent(this.name, { detail: { hiddenTypes } }));
    console.log(`Event ${this.name} dispatched`);
  }
}

export class MapOptionsChangedEvent {
  static on(callback: (mapOptions: MapOptions) => void, singleShot = false) {
    document.addEventListener(
      this.name,
      (ev: CustomEventInit) => {
        callback(ev.detail.mapOptions);
      },
      { once: singleShot }
    );
  }

  static dispatch(mapOptions: MapOptions) {
    document.dispatchEvent(new CustomEvent(this.name, { detail: { mapOptions } }));
    console.log(`Event ${this.name} dispatched`);
  }
}

export class MapSourceChangedEvent {
  static on(callback: (source: string) => void, singleShot = false) {
    document.addEventListener(
      this.name,
      (ev: CustomEventInit) => {
        callback(ev.detail.source);
      },
      { once: singleShot }
    );
  }

  static dispatch(source: string) {
    document.dispatchEvent(new CustomEvent(this.name, { detail: { source } }));
    console.log(`Event ${this.name} dispatched`);
  }
}

export class CoalitionAreaSelectedEvent {
  static on(callback: (coalitionArea: CoalitionCircle | CoalitionPolygon | null) => void, singleShot = false) {
    document.addEventListener(
      this.name,
      (ev: CustomEventInit) => {
        callback(ev.detail.coalitionArea);
      },
      { once: singleShot }
    );
  }

  static dispatch(coalitionArea: CoalitionCircle | CoalitionPolygon | null) {
    document.dispatchEvent(new CustomEvent(this.name, { detail: { coalitionArea } }));
    console.log(`Event ${this.name} dispatched`);
  }
}

export class CoalitionAreaChangedEvent extends CoalitionAreaSelectedEvent {}

export class CoalitionAreasChangedEvent {
  static on(callback: (coalitionAreas: (CoalitionCircle | CoalitionPolygon)[]) => void, singleShot = false) {
    document.addEventListener(
      this.name,
      (ev: CustomEventInit) => {
        callback(ev.detail.coalitionAreas);
      },
      { once: singleShot }
    );
  }

  static dispatch(coalitionAreas: (CoalitionCircle | CoalitionPolygon)[]) {
    document.dispatchEvent(new CustomEvent(this.name, { detail: { coalitionAreas } }));
    console.log(`Event ${this.name} dispatched`);
  }
}

export class AirbaseSelectedEvent {
  static on(callback: (airbase: Airbase | null) => void, singleShot = false) {
    document.addEventListener(
      this.name,
      (ev: CustomEventInit) => {
        callback(ev.detail.airbase);
      },
      { once: singleShot }
    );
  }

  static dispatch(airbase: Airbase | null) {
    document.dispatchEvent(new CustomEvent(this.name, { detail: { airbase } }));
    console.log(`Event ${this.name} dispatched`);
  }
}

export class SelectionEnabledChangedEvent {
  static on(callback: (enabled: boolean) => void, singleShot = false) {
    document.addEventListener(
      this.name,
      (ev: CustomEventInit) => {
        callback(ev.detail.enabled);
      },
      { once: singleShot }
    );
  }

  static dispatch(enabled: boolean) {
    document.dispatchEvent(new CustomEvent(this.name, { detail: { enabled } }));
    console.log(`Event ${this.name} dispatched`);
  }
}

export class PasteEnabledChangedEvent {
  static on(callback: (enabled: boolean) => void, singleShot = false) {
    document.addEventListener(
      this.name,
      (ev: CustomEventInit) => {
        callback(ev.detail.enabled);
      },
      { once: singleShot }
    );
  }

  static dispatch(enabled: boolean) {
    document.dispatchEvent(new CustomEvent(this.name, { detail: { enabled } }));
    console.log(`Event ${this.name} dispatched`);
  }
}

export class ContactsUpdatedEvent {
  static on(callback: () => void, singleShot = false) {
    document.addEventListener(
      this.name,
      (ev: CustomEventInit) => {
        callback();
      },
      { once: singleShot }
    );
  }

  static dispatch() {
    document.dispatchEvent(new CustomEvent(this.name));
    // Logging disabled since periodic
  }
}

export class ContextActionSetChangedEvent {
  static on(callback: (contextActionSet: ContextActionSet | null) => void, singleShot = false) {
    document.addEventListener(
      this.name,
      (ev: CustomEventInit) => {
        callback(ev.detail.contextActionSet);
      },
      { once: singleShot }
    );
  }

  static dispatch(contextActionSet: ContextActionSet | null) {
    document.dispatchEvent(new CustomEvent(this.name, { detail: { contextActionSet } }));
    console.log(`Event ${this.name} dispatched`);
  }
}

export class ContextActionChangedEvent {
  static on(callback: (contextAction: ContextAction | null) => void, singleShot = false) {
    document.addEventListener(
      this.name,
      (ev: CustomEventInit) => {
        callback(ev.detail.contextAction);
      },
      { once: singleShot }
    );
  }

  static dispatch(contextAction: ContextAction | null) {
    document.dispatchEvent(new CustomEvent(this.name, { detail: { contextAction } }));
    console.log(`Event ${this.name} dispatched`);
  }
}

export class CopiedUnitsEvents {
  static on(callback: (unitsData: UnitData[]) => void, singleShot = false) {
    document.addEventListener(
      this.name,
      (ev: CustomEventInit) => {
        callback(ev.detail.unitsData);
      },
      { once: singleShot }
    );
  }

  static dispatch(unitsData: UnitData[]) {
    document.dispatchEvent(new CustomEvent(this.name, { detail: { unitsData } }));
    console.log(`Event ${this.name} dispatched`);
  }
}

export class SelectionClearedEvent extends BaseOlympusEvent {}

export class UnitUpdatedEvent extends BaseUnitEvent {
  static dispatch(unit: Unit) {
    document.dispatchEvent(new CustomEvent(this.name, { detail: { unit } }));
    // Logging disabled since periodic
  }
}
export class UnitSelectedEvent extends BaseUnitEvent {}
export class UnitDeselectedEvent extends BaseUnitEvent {}
export class UnitDeadEvent extends BaseUnitEvent {}

export class UnitsUpdatedEvent extends BaseUnitsEvent {
  static dispatch(units: Unit[]) {
    document.dispatchEvent(new CustomEvent(this.name, { detail: units }));
    // Logging disabled since periodic
  }
}
export class UnitsRefreshedEvent extends BaseUnitsEvent {}
export class SelectedUnitsChangedEvent extends BaseUnitsEvent {}

export class UnitExplosionRequestEvent {
  static on(callback: (units: Unit[]) => void, singleShot = false) {
    document.addEventListener(
      this.name,
      (ev: CustomEventInit) => {
        callback(ev.detail.units);
      },
      { once: singleShot }
    );
  }

  static dispatch(units: Unit[]) {
    document.dispatchEvent(new CustomEvent(this.name, { detail: { units } }));
    console.log(`Event ${this.name} dispatched`);
  }
}

export class FormationCreationRequestEvent {
  static on(callback: (leader: Unit, wingmen: Unit[]) => void, singleShot = false) {
    document.addEventListener(
      this.name,
      (ev: CustomEventInit) => {
        callback(ev.detail.leader, ev.detail.wingmen);
      },
      { once: singleShot }
    );
  }

  static dispatch(leader: Unit, wingmen: Unit[]) {
    document.dispatchEvent(new CustomEvent(this.name, { detail: { leader, wingmen } }));
    console.log(`Event ${this.name} dispatched`);
  }
}

export class MapContextMenuRequestEvent {
  static on(callback: (latlng: L.LatLng) => void, singleShot = false) {
    document.addEventListener(
      this.name,
      (ev: CustomEventInit) => {
        callback(ev.detail.latlng);
      },
      { once: singleShot }
    );
  }

  static dispatch(latlng: L.LatLng) {
    document.dispatchEvent(new CustomEvent(this.name, { detail: { latlng } }));
    console.log(`Event ${this.name} dispatched`);
  }
}

export class UnitContextMenuRequestEvent {
  static on(callback: (unit: Unit) => void, singleShot = false) {
    document.addEventListener(
      this.name,
      (ev: CustomEventInit) => {
        callback(ev.detail.unit);
      },
      { once: singleShot }
    );
  }

  static dispatch(unit: Unit) {
    document.dispatchEvent(new CustomEvent(this.name, { detail: { unit } }));
    console.log(`Event ${this.name} dispatched`);
  }
}

export class SpawnContextMenuRequestEvent {
  static on(callback: (latlng: L.LatLng) => void, singleShot = false) {
    document.addEventListener(
      this.name,
      (ev: CustomEventInit) => {
        callback(ev.detail.latlng);
      },
      { once: singleShot }
    );
  }

  static dispatch(latlng: L.LatLng) {
    document.dispatchEvent(new CustomEvent(this.name, { detail: { latlng } }));
    console.log(`Event ${this.name} dispatched`);
  }
}

export class SpawnHeadingChangedEvent {
  static on(callback: (heading: number) => void, singleShot = false) {
    document.addEventListener(
      this.name,
      (ev: CustomEventInit) => {
        callback(ev.detail.heading);
      },
      { once: singleShot }
    );
  }

  static dispatch(heading: number) {
    document.dispatchEvent(new CustomEvent(this.name, { detail: { heading } }));
    console.log(`Event ${this.name} dispatched`);
  }
}

export class HotgroupsChangedEvent {
  static on(callback: (hotgroups: { [key: number]: Unit[] }) => void, singleShot = false) {
    document.addEventListener(
      this.name,
      (ev: CustomEventInit) => {
        callback(ev.detail.hotgroups);
      },
      { once: singleShot }
    );
  }

  static dispatch(hotgroups: { [key: number]: Unit[] }) {
    document.dispatchEvent(new CustomEvent(this.name, { detail: { hotgroups } }));
    console.log(`Event ${this.name} dispatched`);
  }
}

export class StarredSpawnsChangedEvent {
  static on(callback: (starredSpawns: { [key: number]: SpawnRequestTable }) => void, singleShot = false) {
    document.addEventListener(
      this.name,
      (ev: CustomEventInit) => {
        callback(ev.detail.starredSpawns);
      },
      { once: singleShot }
    );
  }

  static dispatch(starredSpawns: { [key: number]: SpawnRequestTable }) {
    document.dispatchEvent(new CustomEvent(this.name, { detail: { starredSpawns } }));
    console.log(`Event ${this.name} dispatched`);
  }
}

export class AWACSReferenceChangedEvent {
  static on(callback: (unit: Unit | null) => void, singleShot = false) {
    document.addEventListener(
      this.name,
      (ev: CustomEventInit) => {
        callback(ev.detail);
      },
      { once: singleShot }
    );
  }

  static dispatch(unit: Unit | null) {
    document.dispatchEvent(new CustomEvent(this.name, { detail: unit }));
    // Logging disabled since periodic
  }
}

export class DrawingsInitEvent {
  static on(callback: (drawingsData: any /*TODO*/) => void, singleShot = false) {
    document.addEventListener(
      this.name,
      (ev: CustomEventInit) => {
        callback(ev.detail);
      },
      { once: singleShot }
    );
  }

  static dispatch(drawingsData: any  /*TODO*/) {
    document.dispatchEvent(new CustomEvent(this.name, {detail: drawingsData}));
    console.log(`Event ${this.name} dispatched`);
  }
}

export class DrawingsUpdatedEvent extends BaseOlympusEvent {}

/************** Command mode events ***************/
export class CommandModeOptionsChangedEvent {
  static on(callback: (options: CommandModeOptions) => void, singleShot = false) {
    document.addEventListener(
      this.name,
      (ev: CustomEventInit) => {
        callback(ev.detail);
      },
      { once: singleShot }
    );
  }

  static dispatch(options: CommandModeOptions) {
    document.dispatchEvent(new CustomEvent(this.name, { detail: options }));
    console.log(`Event ${this.name} dispatched`);
  }
}

/************** Audio backend events ***************/
export class AudioSourcesChangedEvent {
  static on(callback: (audioSources: AudioSource[]) => void, singleShot = false) {
    document.addEventListener(
      this.name,
      (ev: CustomEventInit) => {
        callback(ev.detail.audioSources);
      },
      { once: singleShot }
    );
  }

  static dispatch(audioSources: AudioSource[]) {
    document.dispatchEvent(new CustomEvent(this.name, { detail: { audioSources } }));
    console.log(`Event ${this.name} dispatched`);
    console.log(audioSources);
  }
}

export class AudioSinksChangedEvent {
  static on(callback: (audioSinks: AudioSink[]) => void, singleShot = false) {
    document.addEventListener(
      this.name,
      (ev: CustomEventInit) => {
        callback(ev.detail.audioSinks);
      },
      { once: singleShot }
    );
  }

  static dispatch(audioSinks: AudioSink[]) {
    document.dispatchEvent(new CustomEvent(this.name, { detail: { audioSinks } }));
    console.log(`Event ${this.name} dispatched`);
    console.log(audioSinks);
  }
}

export class SRSClientsChangedEvent {
  static on(callback: () => void, singleShot = false) {
    document.addEventListener(
      this.name,
      (ev: CustomEventInit) => {
        callback();
      },
      { once: singleShot }
    );
  }

  static dispatch() {
    document.dispatchEvent(new CustomEvent(this.name));
    // Logging disabled since periodic
  }
}

export class AudioManagerStateChangedEvent {
  static on(callback: (state: boolean) => void, singleShot = false) {
    document.addEventListener(
      this.name,
      (ev: CustomEventInit) => {
        callback(ev.detail.state);
      },
      { once: singleShot }
    );
  }

  static dispatch(state: boolean) {
    document.dispatchEvent(new CustomEvent(this.name, { detail: { state } }));
    console.log(`Event ${this.name} dispatched`);
  }
}

export class AudioManagerDevicesChangedEvent {
  static on(callback: (devices: MediaDeviceInfo[]) => void, singleShot = false) {
    document.addEventListener(
      this.name,
      (ev: CustomEventInit) => {
        callback(ev.detail.devices);
      },
      { once: singleShot }
    );
  }

  static dispatch(devices: MediaDeviceInfo[]) {
    document.dispatchEvent(new CustomEvent(this.name, { detail: { devices } }));
    console.log(`Event ${this.name} dispatched`);
  }
}

export class AudioManagerInputChangedEvent {
  static on(callback: (input: MediaDeviceInfo) => void, singleShot = false) {
    document.addEventListener(
      this.name,
      (ev: CustomEventInit) => {
        callback(ev.detail.input);
      },
      { once: singleShot }
    );
  }

  static dispatch(input: MediaDeviceInfo) {
    document.dispatchEvent(new CustomEvent(this.name, { detail: { input } }));
    console.log(`Event ${this.name} dispatched`);
  }
}

export class AudioManagerOutputChangedEvent {
  static on(callback: (output: MediaDeviceInfo) => void, singleShot = false) {
    document.addEventListener(
      this.name,
      (ev: CustomEventInit) => {
        callback(ev.detail.output);
      },
      { once: singleShot }
    );
  }

  static dispatch(output: MediaDeviceInfo) {
    document.dispatchEvent(new CustomEvent(this.name, { detail: { output } }));
    console.log(`Event ${this.name} dispatched`);
  }
}

export class AudioManagerCoalitionChangedEvent {
  static on(callback: (coalition: Coalition) => void, singleShot = false) {
    document.addEventListener(
      this.name,
      (ev: CustomEventInit) => {
        callback(ev.detail.coalition);
      },
      { once: singleShot }
    );
  }

  static dispatch(coalition: Coalition) {
    document.dispatchEvent(new CustomEvent(this.name, { detail: { coalition } }));
    console.log(`Event ${this.name} dispatched`);
  }
}

/************** Mission data events ***************/
export class BullseyesDataChangedEvent {
  static on(callback: (bullseyes: { [name: string]: Bullseye }) => void, singleShot = false) {
    document.addEventListener(
      this.name,
      (ev: CustomEventInit) => {
        callback(ev.detail.bullseyes);
      },
      { once: singleShot }
    );
  }

  static dispatch(bullseyes: { [name: string]: Bullseye }) {
    document.dispatchEvent(new CustomEvent(this.name, { detail: { bullseyes } }));
    // Logging disabled since periodic
  }
}

export class MissionDataChangedEvent {
  static on(callback: (missionData: MissionData) => void, singleShot = false) {
    document.addEventListener(
      this.name,
      (ev: CustomEventInit) => {
        callback(ev.detail.missionData);
      },
      { once: singleShot }
    );
  }

  static dispatch(missionData: MissionData) {
    document.dispatchEvent(new CustomEvent(this.name, { detail: { missionData } }));
    // Logging disabled since periodic
  }
}

export class EnabledCommandModesChangedEvent {
  static on(callback: (enabledCommandModes: string[]) => void, singleShot = false) {
    document.addEventListener(
      this.name,
      (ev: CustomEventInit) => {
        callback(ev.detail.enabledCommandModes);
      },
      { once: singleShot }
    );
  }

  static dispatch(enabledCommandModes: string[]) {
    document.dispatchEvent(new CustomEvent(this.name, { detail: { enabledCommandModes } }));
    // Logging disabled since periodic
  }
}

/************** Other events ***************/
export class WeaponsRefreshedEvent {
  static on(callback: (weapons: Weapon[]) => void, singleShot = false) {
    document.addEventListener(
      this.name,
      (ev: CustomEventInit) => {
        callback(ev.detail);
      },
      { once: singleShot }
    );
  }

  static dispatch(weapons: Weapon[]) {
    document.dispatchEvent(new CustomEvent(this.name, { detail: weapons }));
    console.log(`Event ${this.name} dispatched`);
  }
}
