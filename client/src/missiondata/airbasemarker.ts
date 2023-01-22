import * as L from 'leaflet'

export interface AirbaseOptions
{
    name: string,
    position: L.LatLng,
    src: string
}

export class AirbaseMarker extends L.Marker 
{
    #name: string = "";
    #coalitionID: number = -1;

    constructor(options: AirbaseOptions)
    {
        super(options.position, { riseOnHover: true });

        this.#name = options.name;

        var icon = new L.DivIcon({
            html: `<table class="airbasemarker-container" id="container">
                    <tr>
                        <td>
                            <img class="airbasemarker-icon" id="icon" src="${options.src}">
                            <div class="airbasemarker-name" id="name">${options.name}</div>
                        </td>
                    </tr>
                </table>`, 
            className: 'airbase-marker'});   // Set the marker, className must be set to avoid white square
        this.setIcon(icon);
    }

    setCoalitionID(coalitionID: number)
    {
        this.#coalitionID = coalitionID;
        var element = this.getElement();
        if (element != null)
        {
            var img = element.querySelector("#icon");
            if (img != null)
            {
                img.classList.remove("airbasemarker-icon-blue");
                img.classList.remove("airbasemarker-icon-red");
                if (this.#coalitionID == 2)
                {
                    img.classList.add("airbasemarker-icon-blue");
                }
                else if (this.#coalitionID == 1)
                {
                    img.classList.add("airbasemarker-icon-red");
                }
            }
        }
    }

    getName()
    {
        return this.#name;
    }

    getCoalitionID()
    {
        return this.#coalitionID;
    }
}
