interface CustomEventMap {
    "unitSelection":                    CustomEvent<Unit>,  
    "unitDeselection":                  CustomEvent<Unit>,  
    "unitsSelection":                   CustomEvent<Unit[]>,
    "unitsDeselection":                 CustomEvent<Unit[]>,
    "clearSelection":                   CustomEvent<>,
    "unitCreation":                     CustomEvent<Unit>,  
    "unitDeletion":                     CustomEvent<Unit>, 
    "unitDeath":                        CustomEvent<Unit>, 
    "unitUpdated":                      CustomEvent<Unit>,  
    "unitMoveCommand":                  CustomEvent<Unit>,
    "unitAttackCommand":                CustomEvent<Unit>,
    "unitLandCommand":                  CustomEvent<Unit>,
    "unitSetAltitudeCommand":           CustomEvent<Unit>,
    "unitSetSpeedCommand":              CustomEvent<Unit>,
    "unitSetOption":                    CustomEvent<Unit>,
    "groupCreation":                    CustomEvent<Unit[]>,
    "groupDeletion":                    CustomEvent<Unit[]>,
    "mapStateChanged":                  CustomEvent<string>,
    "mapContextMenu":                   CustomEvent<>,
    "visibilityModeChanged":            CustomEvent<string>,
    "RTSOptionsChanged":                CustomEvent<>,  
}

declare global {
    interface Document {
        addEventListener<K extends keyof CustomEventMap>(type: K,
           listener: (this: Document, ev: CustomEventMap[K]) => void): void;
        dispatchEvent<K extends keyof CustomEventMap>(ev: CustomEventMap[K]): void;
    }
}

export interface ContextMenuOption {
    tooltip: string;
    src: string;
    callback: CallableFunction;
}

export { }; 