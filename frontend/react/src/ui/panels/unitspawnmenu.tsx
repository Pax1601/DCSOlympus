import React from "react";
import { OlUnitSummary } from "../components/olunitsummary";

export function UnitSpawnMenu(props) {
    return <div>
        <OlUnitSummary blueprint={props.blueprint}/>
    </div>
}
