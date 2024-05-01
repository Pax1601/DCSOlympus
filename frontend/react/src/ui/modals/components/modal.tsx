import React from 'react'

export function Modal(props: {
    grayout?: boolean,
	children?: JSX.Element | JSX.Element[],
    className?: string
}) {
    return <div className={props.className + " fixed top-[50%] left-[50%] translate-x-[-50%] translate-y-[-50%] z-ui-2 rounded-xl border-solid border-[1px] border-gray-500"}>
        {props.children}
    </div>
}