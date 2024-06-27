import React, { useState } from 'react';
import { Unit } from '../../unit/unit';
import { ContextActionSet } from '../../unit/contextactionset';
import { OlStateButton } from '../components/olstatebutton';
import { getApp } from '../../olympusapp';
import { ContextAction } from '../../unit/contextaction';
import { CONTEXT_ACTION } from '../../constants/constants';
import { FaInfoCircle } from 'react-icons/fa';

export function UnitMouseControlBar(props: {

}) {
	var [open, setOpen] = useState(false);
	var [selectedUnits, setSelectedUnits] = useState([] as Unit[]);
	var [contextActionsSet, setContextActionsSet] = useState(new ContextActionSet());
	var [activeContextAction, setActiveContextAction] = useState(null as null | ContextAction);

	/* When a unit is selected, open the menu */
	document.addEventListener("unitsSelection", (ev: CustomEventInit) => {
		setOpen(true);
		setSelectedUnits(ev.detail as Unit[]);

		updateData();
	})

	/* When a unit is deselected, refresh the view */
	document.addEventListener("unitDeselection", (ev: CustomEventInit) => {
		/* TODO add delay to avoid doing it too many times */
		updateData();
	})

	/* When all units are deselected clean the view */
	document.addEventListener("clearSelection", () => {
		setOpen(false);
		setSelectedUnits([]);
		updateData();
	})

	/* Deselect the context action when exiting state */
	document.addEventListener("mapStateChanged", (ev) => {
		setOpen(ev.detail === CONTEXT_ACTION);
	})


	/* Update the current values of the shown data */
	function updateData() {
		var newContextActionSet = new ContextActionSet();

		getApp().getUnitsManager().getSelectedUnits().forEach((unit: Unit) => {
			unit.appendContextActions(newContextActionSet);
		})

		setContextActionsSet(newContextActionSet);
		setActiveContextAction(null);
	}

	return <> {
		open && <>
		<div className='flex gap-2 rounded-md absolute top-20 left-[50%] translate-x-[-50%] bg-gray-200 dark:bg-olympus-900 z-ui-2 p-2'>
			{
				Object.values(contextActionsSet.getContextActions()).map((contextAction) => {
					return <OlStateButton checked={contextAction === activeContextAction} icon={contextAction.getIcon()} tooltip={contextAction.getLabel()} onClick={() => {
						if (contextAction.getOptions().executeImmediately) {
							setActiveContextAction(null);
							contextAction.executeCallback(null, null);
						} else {
							if (activeContextAction != contextAction) {
								setActiveContextAction(contextAction);
								getApp().getMap().setState(CONTEXT_ACTION, { contextAction: contextAction });
							} else {
								setActiveContextAction(null);
								getApp().getMap().setState(CONTEXT_ACTION, { contextAction: null });
							}
						}
					}} />
				})
			}
		</div>
		{ activeContextAction && <div className='flex gap-2 p-4 items-center rounded-md absolute top-36 left-[50%] translate-x-[-50%] bg-gray-200 dark:bg-olympus-800 z-ui-1'>
			<FaInfoCircle className="text-blue-500 mr-2 text-sm"/>
			<div className='border-l-[1px] px-5 dark:text-gray-400'>
				{activeContextAction.getDescription()}
			</div>
		</div>
		}
	</>
	}
	</>
}