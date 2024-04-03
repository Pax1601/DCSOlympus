import { createContext } from "react";
import { OlympusState } from "./ui";

export const StateContext = createContext({
    spawnMenuVisible: false,
    unitControlMenuVisible: false,
    measureMenuVisible: false,
    drawingMenuVisible: false
} as OlympusState)

export const StateProvider = StateContext.Provider;
export const StateConsumer = StateContext.Consumer;
