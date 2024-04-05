import { createContext } from "react";

export const EventsContext = createContext({
    setSpawnMenuVisible: (e: boolean) => {},
    setUnitControlMenuVisible: (e: boolean) => {},
    setMeasureMenuVisible: (e: boolean) => {},
    setDrawingMenuVisible: (e: boolean) => {},
    toggleSpawnMenuVisible: () => {},
    toggleUnitControlMenuVisible: () => {},
    toggleMeasureMenuVisible: () => {},
    toggleDrawingMenuVisible: () => {},
})

export const EventsProvider = EventsContext.Provider;
export const EventsConsumer = EventsContext.Consumer;
