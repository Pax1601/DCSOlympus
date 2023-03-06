import * as L from 'leaflet'

export interface AirbaseOptions
{
    name: string,
    position: L.LatLng,
    src: string
}

export class Airbase extends L.Marker 
{
    #name: string = "";
    #coalitionID: number = -1;

    constructor(options: AirbaseOptions)
    {
        super(options.position, { riseOnHover: true });

        this.#name = options.name;

        var icon = new L.DivIcon({
            html: `<table class="airbase-marker-container" id="container">
                    <tr>
                        <td>
                            <img class="airbase-marker-image" id="icon" src="${options.src}">
                            <div class="airbase-marker-name" id="name">${options.name}</div>
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
                img.classList.toggle("blue", this.#coalitionID == 2);
                img.classList.toggle("red", this.#coalitionID == 1);
                img.classList.toggle("neutral", this.#coalitionID == 0);
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
