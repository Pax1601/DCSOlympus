import { createContext } from "react";
import { IDLE, MAP_HIDDEN_TYPES_DEFAULTS, MAP_OPTIONS_DEFAULTS } from "./constants/constants";

export const StateContext = createContext({
  mainMenuVisible: false,
  spawnMenuVisible: false,
  unitControlMenuVisible: false,
  measureMenuVisible: false,
  drawingMenuVisible: false,
  optionsMenuVisible: false,
  airbaseMenuVisible: false,
  mapHiddenTypes: MAP_HIDDEN_TYPES_DEFAULTS,
  mapOptions: MAP_OPTIONS_DEFAULTS,
  mapSources: [] as string[],
  activeMapSource: "",
  mapState: IDLE
});

export const StateProvider = StateContext.Provider;
export const StateConsumer = StateContext.Consumer;
