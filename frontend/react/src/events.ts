import { AudioSink } from "./audio/audiosink";
import { AudioSource } from "./audio/audiosource";
import { OlympusState, OlympusSubState } from "./constants/constants";
import { ServerStatus } from "./interfaces";
import { CoalitionCircle } from "./map/coalitionarea/coalitioncircle";
import { CoalitionPolygon } from "./map/coalitionarea/coalitionpolygon";
import { Airbase } from "./mission/airbase";
import { MapHiddenTypes, MapOptions } from "./types/types";
import { ContextAction } from "./unit/contextaction";
import { ContextActionSet } from "./unit/contextactionset";
import { Unit } from "./unit/unit";

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
    console.log(unit)
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
    console.log(`Event ${this.name} dispatched with detail:`);
    console.log(detail);
  }
}

export class ConfigLoadedEvent {
  /* TODO add config */
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

/************** Map events ***************/
export class HiddenTypesChangedEvent {
  static on(callback: (hiddenTypes: MapHiddenTypes) => void) {
    document.addEventListener(this.name, (ev: CustomEventInit) => {
      callback(ev.detail.hiddenTypes);
    });
  }

  static dispatch(hiddenTypes: MapHiddenTypes) {
    document.dispatchEvent(new CustomEvent(this.name, {detail: {hiddenTypes}}));
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
    document.dispatchEvent(new CustomEvent(this.name, {detail: {mapOptions}}));
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
    document.dispatchEvent(new CustomEvent(this.name, {detail: {source}}));
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
  static on(callback: (airbase: Airbase) => void) {
    document.addEventListener(this.name, (ev: CustomEventInit) => {
      callback(ev.detail.airbase);
    });
  }

  static dispatch(airbase: Airbase) {
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
    console.log(`Event ${this.name} dispatched`);
  }
}

export class ContextActionSetChangedEvent {
  static on(callback: (contextActionSet: ContextActionSet) => void) {
    document.addEventListener(this.name, (ev: CustomEventInit) => {
      callback(ev.detail.contextActionSet);
    });
  }

  static dispatch(contextActionSet: ContextActionSet) {
    document.dispatchEvent(new CustomEvent(this.name, {detail: {contextActionSet}}));
    console.log(`Event ${this.name} dispatched`);
  }
}

export class ContextActionChangedEvent {
  static on(callback: (contextAction: ContextAction) => void) {
    document.addEventListener(this.name, (ev: CustomEventInit) => {
      callback(ev.detail.contextActionSet);
    });
  }

  static dispatch(contextAction: ContextAction) {
    document.dispatchEvent(new CustomEvent(this.name, {detail: {contextAction}}));
    console.log(`Event ${this.name} dispatched`);
  }
}

export class UnitUpdatedEvent extends BaseUnitEvent {};
export class UnitSelectedEvent extends BaseUnitEvent {};
export class UnitDeselectedEvent extends BaseUnitEvent {};
export class UnitDeadEvent extends BaseUnitEvent {};
export class SelectionClearedEvent extends BaseOlympusEvent {};

export class SelectedUnitsChangedEvent {
  static on(callback: (selectedUnits: Unit[]) => void) {
    document.addEventListener(this.name, (ev: CustomEventInit) => {
      callback(ev.detail);
    });
  }

  static dispatch(selectedUnits: Unit[]) {
    document.dispatchEvent(new CustomEvent(this.name, {detail: selectedUnits}));
    console.log(`Event ${this.name} dispatched`);
    console.log(selectedUnits)
  }
}

/************** Command mode events ***************/
export class CommandModeOptionsChangedEvent {
  /* TODO: add command mode options */
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

/************** Audio backend events ***************/
/* TODO: split into two events for signgle source changed */
export class AudioSourcesChangedEvent {
  /* TODO add audio sources */
  static on(callback: (audioSources: AudioSource[]) => void) {
    document.addEventListener(this.name, (ev: CustomEventInit) => {
      callback(ev.detail);
    });
  }

  static dispatch(audioSources: AudioSource[]) {
    document.dispatchEvent(new CustomEvent(this.name, {detail: {audioSources}}));
    console.log(`Event ${this.name} dispatched`);
    console.log(audioSources)
  }
}

/* TODO: split into two events for signgle sink changed */
export class AudioSinksChangedEvent {
  static on(callback: (audioSinks: AudioSink[]) => void) {
    document.addEventListener(this.name, (ev: CustomEventInit) => {
      callback(ev.detail);
    });
  }

  static dispatch(audioSinks: AudioSink[]) {
    document.dispatchEvent(new CustomEvent(this.name, {detail: {audioSinks}}));
    console.log(`Event ${this.name} dispatched`);
    console.log(audioSinks)
  }
}

export class SRSClientsChangedEvent {
  /* TODO add clients */
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
    document.dispatchEvent(new CustomEvent(this.name, {detail: {state}}));
    console.log(`Event ${this.name} dispatched`);
  }
}
