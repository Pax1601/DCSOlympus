import { DivIcon } from 'leaflet';
import { CustomMarker } from '../map/custommarker';
import { SVGInjector } from '@tanem/svg-injector';

export interface AirbaseOptions
{
    name: string,
    position: L.LatLng
}


export interface AirbaseChartData {
    elevation: string,
    ICAO: string,
    TACAN: string,
    runways: AirbaseChartRunwayData[]
}

export interface AirbaseChartRunwayData {
    "headings": AirbaseChartRunwayHeadingData[],
    "length": string
}

export interface AirbaseChartRunwayHeadingData {
    [index: string]: {
        "magHeading": string,
        "ILS": string
    }
}

export class Airbase extends CustomMarker
{
    #name: string = "";
    #chartData: AirbaseChartData = {
        elevation: "",
        ICAO: "",
        TACAN: "",
        runways: []
    };
    #coalition: string = "";
    #hasChartDataBeenSet:boolean = false;
    #properties: string[] = [];
    #parkings: string[] = [];

    constructor(options: AirbaseOptions)
    {
        super(options.position, { riseOnHover: true });

        this.#name = options.name;
    }

    chartDataHasBeenSet() {
        return this.#hasChartDataBeenSet;
    }

    createIcon() {
        var icon = new DivIcon({ 
            className: 'leaflet-airbase-marker',
            iconSize: [40, 40],
            iconAnchor: [20, 20]
            });   // Set the marker, className must be set to avoid white square
        this.setIcon(icon); 

        var el = document.createElement("div");
        el.classList.add("airbase-icon");
        el.setAttribute("data-object", "airbase");
        var img = document.createElement("img");
        img.src = "/resources/theme/images/markers/airbase.svg";
        img.onload = () => SVGInjector(img);
        el.appendChild(img);
        this.getElement()?.appendChild(el);
    }

    setCoalition(coalition: string)
    {
        this.#coalition = coalition;
        (<HTMLElement> this.getElement()?.querySelector(".airbase-icon")).dataset.coalition = this.#coalition;
    }

    getChartData()
    {
        return this.#chartData;
    }

    getCoalition()
    {
        return this.#coalition;
    }

    setName(name: string)
    {
        this.#name = name;
    }

    getName()
    {
        return this.#name;
    }

    setChartData( chartData:AirbaseChartData )
    {
        this.#hasChartDataBeenSet = true;
        this.#chartData           = chartData;
    }

    setProperties(properties: string[])
    {
        this.#properties = properties;
    }

    getProperties()
    {
        return this.#properties;
    }

    setParkings(parkings: string[])
    {
        this.#parkings = parkings;
    }

    getParkings()
    {
        return this.#parkings;
    }
}
