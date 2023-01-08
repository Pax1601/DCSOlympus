export class FormationControlPanel
{
    #panel      : HTMLElement;
    #formations : string[];
    #editing    : boolean;

    constructor(id)
    {
        this.#panel = document.getElementById(id); 

        this.#formations = ["", "Echelon", "Line abreast", "Box", "Trail", "Finger tip", "Tactical line abreast", "Fluid four", "Spread four"];
    }

    update(selectedUnits)
    {
        if (selectedUnits.length == 1)
        {
            // Don't update if user is editing
            if (selectedUnits[0].leader && !this.#editing)
            {
                this.#panel.style.bottom = "15px";
                this.#showFormationControls(selectedUnits[0]);
            }
        }
        else
        {
            this.#panel.style.bottom = (-this.#panel.offsetHeight - 2) + "px";
            this.#showFormationControls(undefined); // Empty, cleans the panel
        }
    }

    #showFormationControls(selectedUnit)
    {
        if (selectedUnit !== undefined)
        {           
            this.#panel.innerHTML = `
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

            var select: HTMLSelectElement = <HTMLSelectElement>document.getElementById("formation-type-select");
            for(var i = 0; i < this.#formations.length; i++) {
                var opt = this.#formations[i];
                var el = document.createElement("option");
                el.textContent = opt;
                el.value = opt;
                select.appendChild(el);
            }

            select.addEventListener("focus", () => this.#editing = true)
            select.addEventListener("blur", () => this.#editing = false)
            //select.addEventListener("change", () => leader.setformation());

            select.value = selectedUnit.formation;
        }
        else
        {
            this.#panel.innerHTML = ``;
        }
    }
}
 
    