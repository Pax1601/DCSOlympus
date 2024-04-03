import React, { MouseEventHandler } from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { IconProp } from '@fortawesome/fontawesome-svg-core'

type ButtonProps = {
    icon: string,
    onClick: CallableFunction,
    active: boolean
}

export class StateButton extends React.Component<ButtonProps, {}> {
    constructor(props) {
        super(props);
        this.state = {
            active: true
        }
    }

    render() {
        var computedClassName = "";
        computedClassName += this.props.active? 'bg-white text-background-darker': 'bg-transparent text-white border-white';
        
        return (
          <FontAwesomeIcon icon={this.props.icon as IconProp} className={computedClassName + " rounded w-5 h-5 p-2 border-2"} onClick={this.props.onClick as MouseEventHandler}>
          </FontAwesomeIcon>
        );
    }
}