import { createContext } from "react";
import { MAP_HIDDEN_TYPES_DEFAULTS, MAP_OPTIONS_DEFAULTS, NO_SUBSTATE, OlympusState, OlympusSubState } from "./constants/constants";
import { Unit } from "./unit/unit";
import { AudioSource } from "./audio/audiosource";
import { AudioSink } from "./audio/audiosink";
import { ServerStatus } from "./interfaces";
import { ContextActionSet } from "./unit/contextactionset";
import { ContextAction } from "./unit/contextaction";

export const StateContext = createContext({
  appState: OlympusState.NOT_INITIALIZED as OlympusState,
  appSubState: NO_SUBSTATE as OlympusSubState,
  mapHiddenTypes: MAP_HIDDEN_TYPES_DEFAULTS,
  mapOptions: MAP_OPTIONS_DEFAULTS,
  mapSources: [] as string[],
  activeMapSource: "",
  selectedUnits: [] as Unit[],
  audioSources: [] as AudioSource[],
  audioSinks: [] as AudioSink[],
  audioManagerState: false,
  serverStatus: {} as ServerStatus,
  contextActionSet: null as ContextActionSet | null,
  contextAction: null as ContextAction | null
});

export const StateProvider = StateContext.Provider;
export const StateConsumer = StateContext.Consumer;
