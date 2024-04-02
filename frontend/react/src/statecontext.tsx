import { createContext } from "react";
import { OlympusState } from "./App";

export const StateContext = createContext({
    spawnMenuVisible: false,
    unitControlMenuVisible: false,
    measureMenuVisible: false,
    drawingMenuVisible: false
} as OlympusState)

export const StateProvider = StateContext.Provider;
export const StateConsumer = StateContext.Consumer;
