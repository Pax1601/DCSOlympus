import { createContext } from "react";

export const EventsContext = createContext({
    showSpawnMenu: (e: boolean) => {},
    toggleSpawnMenu: () => {},
    showUnitControlMenu: (e: boolean) => {},
    toggleUnitControlMenu: () => {},
    showMeasureMenu: (e: boolean) => {},
    toggleMeasureMenu: () => {},
    showDrawingMenu: (e: boolean) => {},
    toggleDrawingMenu: () => {}
})

export const EventsProvider = EventsContext.Provider;
export const EventsConsumer = EventsContext.Consumer;
