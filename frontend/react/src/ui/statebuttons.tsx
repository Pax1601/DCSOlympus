import React from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { IconProp } from '@fortawesome/fontawesome-svg-core'

type ButtonProperties = {
    icon: string
}

type ButtonState = {
    active: boolean
}

export class StateButton extends React.Component<ButtonProperties, ButtonState> {
    constructor(props) {
        super(props);
        this.state = {
            active: true
        }
    }

    render() {
        var computedClassName = "";
        computedClassName += this.state.active? 'bg-white text-background-steel': 'bg-transparent text-white border-white';
        
        return (
          <FontAwesomeIcon icon={this.props.icon as IconProp} className={computedClassName + " rounded w-5 h-5 p-2 border-2"} onClick={() => this.setState({active: !this.state.active})}>
          </FontAwesomeIcon>
        );
    }
}