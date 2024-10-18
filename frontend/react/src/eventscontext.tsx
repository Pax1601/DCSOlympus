import { createContext } from "react";

export const EventsContext = createContext({
  setMainMenuVisible: (e: boolean) => {},
  setSpawnMenuVisible: (e: boolean) => {},
  setUnitControlMenuVisible: (e: boolean) => {},
  setMeasureMenuVisible: (e: boolean) => {},
  setDrawingMenuVisible: (e: boolean) => {},
  setOptionsMenuVisible: (e: boolean) => {},
  setAirbaseMenuVisible: (e: boolean) => {},
  setAudioMenuVisible: (e: boolean) => {},
  setJTACMenuVisible: (e: boolean) => {},
  toggleMainMenuVisible: () => {},
  toggleSpawnMenuVisible: () => {},
  toggleUnitControlMenuVisible: () => {},
  toggleMeasureMenuVisible: () => {},
  toggleDrawingMenuVisible: () => {},
  toggleOptionsMenuVisible: () => {},
  toggleAirbaseMenuVisible: () => {},
  toggleAudioMenuVisible: () => {},
  toggleJTACMenuVisible: () => {},
});

export const EventsProvider = EventsContext.Provider;
export const EventsConsumer = EventsContext.Consumer;
