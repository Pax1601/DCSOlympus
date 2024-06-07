import React, { useEffect, useState } from 'react';
import { Unit } from '../../unit/unit';
import { ContextActionSet } from '../../unit/contextactionset';
import { OlStateButton } from '../components/olstatebutton';
import { faAccessibleIcon } from '@fortawesome/free-brands-svg-icons';
import { faCamera } from '@fortawesome/free-solid-svg-icons';
import { getApp } from '../../olympusapp';

export function UnitMouseControlBar(props: {

}) {
    var [open, setOpen] = useState(false);
	var [selectedUnits, setSelectedUnits] = useState([] as Unit[]);
	var [contextActionsSet, setContextActionsSet] = useState(new ContextActionSet());

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

    /* Update the current values of the shown data */
	function updateData() {
		var newContextActionSet = new ContextActionSet();

        getApp().getUnitsManager().getSelectedUnits().forEach((unit: Unit) => {
            unit.appendContextActions(newContextActionSet);
        })

		setContextActionsSet(newContextActionSet);
    }

    return <div className='flex gap-2 rounded-md absolute top-20 left-[50%] translate-x-[-50%] bg-gray-200 dark:bg-olympus-900 z-ui-1 p-2'>
        {
			Object.values(contextActionsSet.getContextActions()).map((contextAction) => {
				return <OlStateButton checked={false} icon={contextAction.getIcon()} onClick={() => {}} />
			})
		}
    </div>
}