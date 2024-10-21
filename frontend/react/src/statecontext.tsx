import { createContext } from "react";
import { MAP_HIDDEN_TYPES_DEFAULTS, MAP_OPTIONS_DEFAULTS, NO_SUBSTATE, OlympusState, OlympusSubState } from "./constants/constants";

export const StateContext = createContext({
  appState: OlympusState.NOT_INITIALIZED as OlympusState,
  appSubState: NO_SUBSTATE as OlympusSubState,
  mapHiddenTypes: MAP_HIDDEN_TYPES_DEFAULTS,
  mapOptions: MAP_OPTIONS_DEFAULTS,
  mapSources: [] as string[],
  activeMapSource: ""
});

export const StateProvider = StateContext.Provider;
export const StateConsumer = StateContext.Consumer;
