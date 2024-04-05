import React, { ChangeEvent } from "react";

type OlToggleState = {
    checked: boolean
}

type OlToggleProps = {
    checkedLabel: string,
    uncheckedLabel: string
}

export class OlToggle extends React.Component<OlToggleProps, OlToggleState> {
    constructor(props) {
        super(props);

        this.state = {
            checked: false
        }

        this.onToggle = this.onToggle.bind(this);
    }

    onToggle(e: ChangeEvent<HTMLInputElement>) {
        this.setState({
            checked: e.target.checked
        })
    }

    render() {
        return <label className="flex items-center cursor-pointer -mr-8">
          <input type="checkbox" value="" className="sr-only peer" onChange={this.onToggle}/>
          <div className="relative w-16 h-6 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-500 peer-checked:after:translate-x-[200%] rtl:peer-checked:after:-translate-x-[200%] peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-interaction-blue"></div>
          <span className={(this.state.checked? "-translate-x-[250%]": "-translate-x-[180%]") + " ms-3 text-sm font-medium text-gray-900 dark:text-white transition-all select-none relative w-7"}>
            {this.state.checked? this.props.checkedLabel: this.props.uncheckedLabel}
            </span>
        </label>
    }
}