import React from 'react'
import { StateButton } from './statebuttons';
import { faPlus, faGamepad, faRuler, faPencil } from '@fortawesome/free-solid-svg-icons';
import { library } from '@fortawesome/fontawesome-svg-core'

library.add(faPlus, faGamepad, faRuler, faPencil)

type HeaderProps = {

}

type HeaderState = {

}

export class Header extends React.Component<HeaderProps, HeaderState> {
    render() {
        return (
          <div className='absolute top-0 left-0 h-16 w-full z-ui bg-background-steel flex flex-row items-center px-5'>
            <div className="flex flex-row items-center gap-1">
                <StateButton icon="fa-solid fa-plus"></StateButton>
                <StateButton icon="fa-solid fa-gamepad"></StateButton>
                <StateButton icon="fa-solid fa-ruler"></StateButton>
                <StateButton icon="fa-solid fa-pencil"></StateButton>
            </div>
          </div>
        );
    }
}
