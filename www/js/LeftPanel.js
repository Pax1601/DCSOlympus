class LeftPanel
{
    constructor(id)
    {
        this._panel = document.getElementById(id); 
    }

    update(selectedUnits)
    {
        if (selectedUnits.length > 0)
        {
            this._panel.style.bottom = "15px";
            if (selectedUnits.length == 1)
            {
                this._showUnitData(selectedUnits[0]);
            }
            else
            {

            }
        }
        else
        {
            this._showUnitData();
            this._panel.style.bottom = "-80px";
        }
    }

    _showUnitData(selectedUnit)
    {
        if (selectedUnit !== undefined)
        {
            this._panel.innerHTML = `
            <table class="panel-table">
                <tr>
                    <td colspan="4" class="panel-title">
                        UNIT INFO
                    </td>
                </tr>
                <tr>
                    <td class="panel-label">
                        Name: 
                    </td>
                    <td class="panel-content">
                        ${selectedUnit.unitName}
                    </td>
                    <td class="panel-label">
                        Group: 
                    </td>
                    <td class="panel-content">
                        ${selectedUnit.groupName}
                    </td>
                </tr>
                <tr>
                    <td class="panel-label">
                        Heading:
                    </td>
                    <td class="panel-content">
                        ${Math.floor(rad2deg(selectedUnit.heading)) + "°"}
                    </td>
                    <td class="panel-label">
                        Altitude:
                    </td>
                    <td class="panel-content">
                        ${Math.floor(selectedUnit.altitude / 0.3048) + "ft"}
                    </td>
                </tr>
                <tr>
                <td class="panel-label">
                    Position:
                </td>
                <td class="panel-content" colspan="3">
                    ${ConvertDDToDMS(selectedUnit.latitude, false) + " " + ConvertDDToDMS(selectedUnit.longitude, true)}
                </td>
                <td>
                </td>
            </tr>
            </table>
            `;     
        }
        else
        {
            this._panel.innerHTML = `
            <table class="panel-table">
                <tr>
                    <td class="panel-title">
                        UNIT INFO
                    </td>
                </tr>
            </table>
            `;
        }
    }
}