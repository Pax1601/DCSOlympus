import { ServerStatus } from "./interfaces";
import { Unit } from "./unit/unit";

interface CustomEventMap {
  unitSelection: CustomEvent<Unit>;
  unitDeselection: CustomEvent<Unit>;
  unitsSelection: CustomEvent<Unit[]>;
  unitsDeselection: CustomEvent<Unit[]>;
  clearSelection: CustomEvent<any>;
  unitDeath: CustomEvent<Unit>;
  unitUpdated: CustomEvent<Unit>;
  mapStateChanged: CustomEvent<string>;
  mapContextMenu: CustomEvent<any>;
  mapOptionChanged: CustomEvent<any>;
  mapSourceChanged: CustomEvent<string>;
  mapOptionsChanged: CustomEvent<any>; // TODO not very clear, why the two options?
  mapSelectionEnd: CustomEvent<any>;
  configLoaded: CustomEvent<any>;
  commandModeOptionsChanged: CustomEvent<any>;
  contactsUpdated: CustomEvent<Unit>;
  activeCoalitionChanged: CustomEvent<any>;
  serverStatusUpdated: CustomEvent<ServerStatus>;
  mapForceBoxSelect: CustomEvent<any>
}

declare global {
  interface Document {
    addEventListener<K extends keyof CustomEventMap>(
      type: K,
      listener: (this: Document, ev: CustomEventMap[K]) => void
    ): void;
    dispatchEvent<K extends keyof CustomEventMap>(ev: CustomEventMap[K]): void;
  }

  //function getOlympusPlugin(): OlympusPlugin;
}

export {};
