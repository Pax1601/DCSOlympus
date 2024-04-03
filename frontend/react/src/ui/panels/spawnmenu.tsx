import React from "react";
import { MenuTitle } from "./components/menutitle";

export class SpawnMenu extends React.Component<{}, {}> {
    constructor(props) {
        super(props);
    }

    render() {
        return <div className="h-full w-96 bg-background-neutral z-ui">
            <MenuTitle title="Spawn menu"></MenuTitle>
        </div>
    }
}