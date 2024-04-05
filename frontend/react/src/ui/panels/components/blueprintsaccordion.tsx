import React from "react";
import { UnitBlueprint } from "../../../interfaces";
import { IconProp, library } from '@fortawesome/fontawesome-svg-core'
import { faChevronLeft } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

library.add(faChevronLeft);

export type BlueprintsAccordionProps = {
    title: string,
    icon: string,
    blueprints: { [key: string]: UnitBlueprint },
    searchString: string,
    callback: CallableFunction
}

export type BlueprintsAccordionState = {
    open: boolean
}

export class BlueprintsAccordion extends React.Component<BlueprintsAccordionProps, BlueprintsAccordionState> {
    constructor(props) {
        super(props);
        this.state = {
            open: this.props.searchString !== ''
        }

        this.toggleOpen = this.toggleOpen.bind(this);
    }

    toggleOpen() {
        this.setState({ open: !this.state.open });
    }

    checkSearch(key) {
        const blueprint = this.props.blueprints[key];
        if (blueprint.label.includes(this.props.searchString))
            return true;
        else
            return false;
    }

    render() {
        if (this.props.searchString !== '' && !this.state.open)
            this.setState({ open: true });

        return <div>
            <div className="cursor-pointer select-none flex justify-between p-2 items-center" onClick={this.toggleOpen}>
                <div className="">{this.props.title}</div>
                <FontAwesomeIcon icon="chevron-left" className={"transition-transform " + (this.state.open ? "-rotate-90" : "")}></FontAwesomeIcon>
            </div>
            <div className="flex flex-col px-3">
                {
                    this.state.open && 
                    Object.keys(this.props.blueprints).filter((key) => {
                        return this.checkSearch(key);
                    }).map((key) => {
                        return <div key={key} className="cursor-pointer select-none flex justify-between items-center hover:bg-white hover:bg-opacity-10 px-2 py-1 rounded-sm" onClick={() => this.props.callback(this.props.blueprints[key])}>
                            <FontAwesomeIcon icon={this.props.icon as IconProp} className="text-sm"></FontAwesomeIcon>
                            <div className="font-normal text-left flex-1 px-2">{this.props.blueprints[key].label}</div>
                            <div className="bg-black bg-opacity-20 text-gray-400 rounded-full px-2 py-0.5 text-xs">{this.props.blueprints[key].era === "WW2" ? "WW2" : this.props.blueprints[key].era.split(" ").map((word) => {
                                return word.charAt(0).toLocaleUpperCase();
                            })}</div>
                        </div>
                    })
                }
            </div>
        </div>
    }
}