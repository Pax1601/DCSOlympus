import React, {useState} from "react";
import { OlUnitSummary } from "../components/olunitsummary";
import { OlCoalitionToggle } from "../components/olcoalitiontoggle";
import { OlNumberInput } from "../components/olnumberinput";
import { OlLabelToggle } from "../components/ollabeltoggle";
import { OlRangeSlider } from "../components/olrangeslider";

export function UnitSpawnMenu(props) {
    var [spawnAltitude, setSpawnAltitude] = useState(1000);

    return <div className="flex flex-col gap-3">
        <OlUnitSummary blueprint={props.blueprint}/>
        <div className="flex flex-row content-center justify-between w-full">
            <OlCoalitionToggle />
            <OlNumberInput placeHolder={1} minValue={1} maxValue={4}/>
        </div>
        <div>
            <div className="flex flex-row content-center justify-between">
                <div className="flex flex-col">
                    <span className="dark: text-white">Altitude</span>
                    <span className="dark:text-blue-500">{`${spawnAltitude} FT`}</span>
                </div>
                <OlLabelToggle />
            </div>
            <OlRangeSlider onChange={setSpawnAltitude} minValue={0} maxValue={30000} step={500}/>
            </div>
    </div>
}
