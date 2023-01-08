class FormationControlPanel
{
    constructor(id)
    {
        this._panel = document.getElementById(id); 

        this._formations = ["", "Echelon", "Line abreast", "Box", "Trail", "Finger tip", "Tactical line abreast", "Fluid four", "Spread four"];
    }

    update(selectedUnits)
    {
        if (selectedUnits.length == 1)
        {
            // Don't update if user is editing
            if (selectedUnits[0].leader && !this._editing)
            {
                this._panel.style.bottom = "15px";
                this._showFormationControls(selectedUnits[0]);
            }
        }
        else
        {
            this._panel.style.bottom = (-this._panel.offsetHeight - 2) + "px";
            this._showFormationControls(); // Empty, cleans the panel
        }
    }

    _showFormationControls(selectedUnit)
    {
        if (selectedUnit !== undefined)
        {           
            this._panel.innerHTML = `
                <div style="display: flex">
                <table class="panel-table" id="unit-info-table">
                    <tr>
                        <td colspan="4" class="panel-title">
                            FORMATION CONTROL
                        </td>
                    </tr>
                    <tr>
                    <td class="panel-label">
                        Formation: 
                    </td>
                    <td class="panel-content">
                        ${selectedUnit.formationID}
                    </td>
                    </tr>   
                    <tr>
                    <td class="panel-label">
                        Formation type: 
                    </td>
                    <td class="panel-content">
                    <select id="formation-type-select"></select>
                    </td>
                    </tr>
                </table>
                </div>
                `;   

            var select = document.getElementById("formation-type-select");
            for(var i = 0; i < this._formations.length; i++) {
                var opt = this._formations[i];
                var el = document.createElement("option");
                el.textContent = opt;
                el.value = opt;
                select.appendChild(el);
            }

            select.addEventListener("focus", () => this._editing = true)
            select.addEventListener("blur", () => this._editing = false)
            object.addEventListener("change", () => leader.setformation());

            select.value = selectedUnit.formation;
        }
        else
        {
            this._panel.innerHTML = ``;
        }
    }
}
 
    