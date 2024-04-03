import React from "react";

export class MenuTitle extends React.Component<{title: string}, {}> {
    render() {
        return <div className="h-12 w-full bg-background-dark flex items-center px-4 font-semibold">
        {this.props.title}
    </div>
    }
}
