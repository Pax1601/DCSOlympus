import * as L from 'leaflet'

export namespace Olympus
{
    export class Map extends L.Map 
    {
        constructor(containerId: string)
        {
            super(containerId, {doubleClickZoom: false});
            this.setView([37.23, -115.8], 12);

            L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
                attribution: 'Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community'
            }).addTo(this);
        }
    } 
}