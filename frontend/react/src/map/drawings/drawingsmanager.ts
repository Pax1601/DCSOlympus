import { decimalToRGBA } from "../../other/utils";
import { getApp } from "../../olympusapp";
import { DrawingsInitEvent, DrawingsUpdatedEvent, MapOptionsChangedEvent, SessionDataLoadedEvent } from "../../events";
import { MapOptions } from "../../types/types";
import { Circle, DivIcon, Layer, LayerGroup, layerGroup, Marker, Polygon, Polyline } from "leaflet";
import { NavpointMarker } from "../markers/navpointmarker";

export abstract class DCSDrawing {
  #name: string;
  #parent: DCSDrawingsContainer;
  #weight: number;

  constructor(drawingData, parent: DCSDrawingsContainer) {
    this.#name = drawingData["name"];
    this.#parent = parent;
    this.setWeight(drawingData);
  }

  getName() {
    return this.#name;
  }

  getParent() {
    return this.#parent;
  }

  toJSON() {
    return {
      name: this.#name,
      opacity: this.getOpacity(),
      visibility: this.getVisibility(),
    };
  }

  setWeight(drawingData) {
    if (!drawingData.thickness) {
      return;
    }

    this.#weight = drawingData.thickness * 0.5;

    if (this.#weight === 0) {
      this.#weight = 0.1;
    }

    if (this.#weight > 1) {
      this.#weight = 1;
    }
  }

  getWeight() {
    return this.#weight;
  }

  abstract getLayer(): Layer;
  abstract setOpacity(opacity: number): void;
  abstract getOpacity(): number;
  abstract setVisibility(visibility: boolean): void;
  abstract getVisibility(): boolean;
}

export class DCSEmptyLayer extends DCSDrawing {
  getLayer() {
    return layerGroup();
  }

  setOpacity(opacity: number): void {
    //Do nothing
  }

  setVisibility(visibility: boolean): void {
    //Do nothing
  }

  getOpacity(): number {
    return 1;
  }

  getVisibility(): boolean {
    return false;
  }
}

export class DCSPolygon extends DCSDrawing {
  #polygon: Polygon | Circle;

  constructor(drawingData, parent) {
    super(drawingData, parent);

    const polygonMode = drawingData["polygonMode"];
    let dashArray: number[] | string = [];

    switch (drawingData.style) {
      case "dash":
        dashArray = [5];
      case "dot":
        dashArray = [2];
      case "dotdash":
        dashArray = "2, 5, 5, 5";
    }

    switch (polygonMode) {
      case "circle":
        // Example circle:
        /*
					colorString: 4278190335
					fillColorString: 4278190127
					lat: 27.65469131156049
					layer: "Blue"
					layerName: "Blue"
					lng: 54.33075915954884
					name: "SA11-2 + SA6-3"
					points: {0: {…}, x: 166867.07767244, y: -187576.93134045}
					polygonMode: "circle"
					primitiveType: "Polygon"
					radius: 36651.296128911
					style: "dash"
					thickness: 16
					visible: true*/

        this.#polygon = new Circle([drawingData.lat, drawingData.lng], {
          radius: Math.round(drawingData.radius),
          color: `${decimalToRGBA(drawingData.colorString)}`,
          fillColor: `${decimalToRGBA(drawingData.fillColorString)}`,
          opacity: 1,
          fillOpacity: 1,
          weight: this.getWeight(),
          dashArray: dashArray,
        });
        break;

      case "arrow":
        let weight = this.getWeight();
        
        if (!weight || weight < 1) {
          weight = 1;
        }


        const arrowBounds = [
          [drawingData.points["1"].lat, drawingData.points["1"].lng],
          [drawingData.points["2"].lat, drawingData.points["2"].lng],
          [drawingData.points["3"].lat, drawingData.points["3"].lng],
          [drawingData.points["4"].lat, drawingData.points["4"].lng],
          [drawingData.points["5"].lat, drawingData.points["5"].lng],
          [drawingData.points["6"].lat, drawingData.points["6"].lng],
          [drawingData.points["7"].lat, drawingData.points["7"].lng],
          [drawingData.points["8"].lat, drawingData.points["8"].lng],
        ];

        this.#polygon = new Polygon(arrowBounds, {
          color: `${decimalToRGBA(drawingData.colorString)}`,
          fillColor: `${decimalToRGBA(drawingData.fillColorString)}`,
          opacity: 1,
          fillOpacity: 1,
          weight: weight,
          dashArray,
        });
        break;

      case "rect":
        /** Rectangle Example:
					 * {
						"angle": 68.579040048342,
						"colorString": 255,
						"fillColorString": 4294901888,
						"height": 11100,
						"lat": 27.5547706075188,
						"layer": "Author",
						"layerName": "Author",
						"lng": 57.22438242806247,
						"mapX": 152970.68262179,
						"mapY": 97907.892121675,
						"name": "FLOT BUFFER EAST",
						"points": {
							"1": {
								"lat": 27.417344649833286,
								"lng": 57.34472624501578
							},
							"2": {
								"lat": 27.38096510320196,
								"lng": 57.24010993680159
							},
							"3": {
								"lat": 27.69209116201148,
								"lng": 57.1037392116416
							},
							"4": {
								"lat": 27.728570135811577,
								"lng": 57.20860735951096
							}
						},
						"polygonMode": "rect",
						"primitiveType": "Polygon",
						"style": "dot",
						"thickness": 16,
						"visible": true,
						"width": 37000
					}
					*/
        const bounds = [
          [drawingData.points["1"].lat, drawingData.points["1"].lng],
          [drawingData.points["2"].lat, drawingData.points["2"].lng],
          [drawingData.points["3"].lat, drawingData.points["3"].lng],
          [drawingData.points["4"].lat, drawingData.points["4"].lng],
        ];

        this.#polygon = new Polygon(bounds, {
          color: `${decimalToRGBA(drawingData.colorString)}`,
          fillColor: `${decimalToRGBA(drawingData.fillColorString)}`,
          opacity: 1,
          fillOpacity: 1,
          weight: this.getWeight(),
          dashArray: dashArray,
        });
        break;

      case "oval":
        /**
					 * Example:
					 * {
						"angle": 270,
						"colorString": 255,
						"fillColorString": 4278190080,
						"lat": 25.032272009407105,
						"layer": "Blue",
						"layerName": "Blue",
						"lng": 55.36597899137401,
						"mapX": -125416.92956726,
						"mapY": -89103.936896595,
						"name": "AM OTP",
						"points": {
							"1": {
								"lat": 25.03332743167039,
								"lng": 55.34689257576858
							},
							"2": {
								"lat": 25.034529398092356,
								"lng": 55.348849087588164
							},
							...
							"24": {
								"lat": 25.032053589358366,
								"lng": 55.34623694782629
							}
						},
						"polygonMode": "oval",
						"primitiveType": "Polygon",
						"r1": 1992.4714734497,
						"r2": 541.99904672895,
						"style": "dot",
						"thickness": 10,
						"visible": true
					}
					 */
        const points: [number, number][] = Object.values(drawingData.points as Record<string, { lat: number; lng: number }>).map((p) => [p.lat, p.lng]);

        this.#polygon = new Polygon(points, {
          color: `${decimalToRGBA(drawingData.colorString)}`,
          fillColor: `${decimalToRGBA(drawingData.fillColorString)}`,
          opacity: 1,
          fillOpacity: 1,
          weight: this.getWeight(),
          dashArray: dashArray,
        });

      case "free":
        const freePolypoints: [number, number][] = Object.values(drawingData.points as Record<string, { lat: number; lng: number }>).map((p) => [p.lat, p.lng]);

        this.#polygon = new Polygon(freePolypoints, {
          color: `${decimalToRGBA(drawingData.colorString)}`,
          fillColor: `${decimalToRGBA(drawingData.fillColorString)}`,
          opacity: 1,
          fillOpacity: 1,
          weight: this.getWeight(),
          dashArray: dashArray,
        });
        break;
      
        default:
        break;
    }

    this.setVisibility(true);
  }

  getLayer() {
    return this.#polygon;
  }

  setOpacity(opacity: number): void {
    if (opacity === this.#polygon.options.fillOpacity && opacity === this.#polygon.options.opacity) return;

    this.#polygon.options.fillOpacity = opacity;
    this.#polygon.options.opacity = opacity;
    this.#polygon.redraw();

    getApp().getDrawingsManager().requestUpdateEventDispatch();
  }

  setVisibility(visibility: boolean): void {
    if (visibility && !this.getParent().getLayerGroup().hasLayer(this.#polygon)) this.#polygon.addTo(this.getParent().getLayerGroup());
    //@ts-ignore Leaflet typings are wrong
    if (!visibility && this.getParent().getLayerGroup().hasLayer(this.#polygon)) this.#polygon.removeFrom(this.getParent().getLayerGroup());

    if (visibility && !this.getParent().getVisibility()) this.getParent().setVisibility(true);

    getApp().getDrawingsManager().requestUpdateEventDispatch();
  }

  getOpacity(): number {
    return this.#polygon.options.opacity ?? 1;
  }

  getVisibility(): boolean {
    return this.getParent().getLayerGroup().hasLayer(this.#polygon);
  }
}

export class DCSLine extends DCSDrawing {
  #line: Polyline;

  constructor(drawingData, parent) {
    super(drawingData, parent);

    const points: [number, number][] = Object.values(drawingData.points as Record<string, { lat: number; lng: number }>).map((p) => [p.lat, p.lng]);
    const dashArray = drawingData.style === "dot" ? "5" : drawingData.style === "dot2" ? "10" : undefined;

    this.#line = new Polyline(points, {
      color: `${decimalToRGBA(drawingData.colorString)}`,
      weight: this.getWeight(),
      dashArray: dashArray,
    });

    this.setVisibility(true);
  }

  getLayer() {
    return this.#line;
  }

  setOpacity(opacity: number): void {
    if (opacity === this.#line.options.opacity) return;

    this.#line.options.opacity = opacity;
    this.#line.redraw();

    getApp().getDrawingsManager().requestUpdateEventDispatch();
  }

  setVisibility(visibility: boolean): void {
    if (visibility && !this.getParent().getLayerGroup().hasLayer(this.#line)) this.#line.addTo(this.getParent().getLayerGroup());
    //@ts-ignore Leaflet typings are wrong
    if (!visibility && this.getParent().getLayerGroup().hasLayer(this.#line)) this.#line.removeFrom(this.getParent().getLayerGroup());

    if (visibility && !this.getParent().getVisibility()) this.getParent().setVisibility(true);

    getApp().getDrawingsManager().requestUpdateEventDispatch();
  }

  getOpacity(): number {
    return this.#line.options.opacity ?? 1;
  }

  getVisibility(): boolean {
    return this.getParent().getLayerGroup().hasLayer(this.#line);
  }
}

export class DCSTextBox extends DCSDrawing {
  #marker: Marker;

  constructor(drawingData, parent) {
    super(drawingData, parent);

    /* Example textbox "ABC625": 
			  angle: 0
			  borderThickness: 1
			  colorString: 4294967295
			  fillColorString: 8421504
			  font: "DejaVuLGCSansCondensed.ttf"
			  fontSize: 10
			  layer: "Common"
			  layerName: "Common"
			  mapX: -261708.68309463
			  mapY: -217863.03743212
			  name: "ABC625"
			  primitiveType: "TextBox"
			  text: "ABC625"
			  visible: true 
			*/
    const customIcon = new DivIcon({
      html: `
				<div style="
					border: ${drawingData.borderThickness}px solid ${decimalToRGBA(drawingData.colorString)}; 
					background-color: ${decimalToRGBA(drawingData.fillColorString)};
					color: ${decimalToRGBA(drawingData.colorString)}; 
					padding: 5px;
					font-family: Arial, sans-serif; 
					font-size: ${drawingData.fontSize - 1}px;
					text-align: center;
					width: max-content; 
					transform: rotate(${drawingData.angle}deg);
					transform-origin: center;
					opacity: 100%;
				">
					${drawingData.text || drawingData.name}
				</div>
				`,
      // iconSize: [100, 50], // Dimensioni del box
      iconAnchor: [50, 25], // Punto di ancoraggio al centro
      className: "",
    });

    this.#marker = new Marker([drawingData.lat, drawingData.lng], { icon: customIcon });

    this.setVisibility(true);
  }

  getLayer() {
    return this.#marker;
  }

  setOpacity(opacity: number): void {
    if (opacity === this.#marker.options.opacity) return;

    this.#marker.options.opacity = opacity;

    /* Hack to force marker redraw */
    const originalVisibility = this.getVisibility();
    this.setVisibility(false);
    this.setVisibility(originalVisibility);

    getApp().getDrawingsManager().requestUpdateEventDispatch();
  }

  setVisibility(visibility: boolean): void {
    if (visibility && !this.getParent().getLayerGroup().hasLayer(this.#marker)) this.#marker.addTo(this.getParent().getLayerGroup());
    //@ts-ignore Leaflet typings are wrong
    if (!visibility && this.getParent().getLayerGroup().hasLayer(this.#marker)) this.#marker.removeFrom(this.getParent().getLayerGroup());

    if (visibility && !this.getParent().getVisibility()) this.getParent().setVisibility(true);

    getApp().getDrawingsManager().requestUpdateEventDispatch();
  }

  getOpacity(): number {
    return this.#marker.options.opacity ?? 1;
  }

  getVisibility(): boolean {
    return this.getParent().getLayerGroup().hasLayer(this.#marker);
  }
}

export class DCSNavpoint extends DCSDrawing {
  #point: NavpointMarker;

  constructor(drawingData, parent) {
    super(drawingData, parent);

    this.#point = new NavpointMarker([drawingData.lat, drawingData.lng], drawingData.callsignStr, drawingData.comment);

    this.setVisibility(true);
  }

  getLayer() {
    return this.#point;
  }

  getLabelLayer() {
    return this.#point;
  }

  setOpacity(opacity: number): void {
    if (opacity === this.#point.options.opacity) return;

    this.#point.options.opacity = opacity;

    /* Hack to force marker redraw */
    const originalVisibility = this.getVisibility();
    this.setVisibility(false);
    this.setVisibility(originalVisibility);

    getApp().getDrawingsManager().requestUpdateEventDispatch();
  }

  setVisibility(visibility: boolean): void {
    if (visibility && !this.getParent().getLayerGroup().hasLayer(this.#point)) this.#point.addTo(this.getParent().getLayerGroup());
    //@ts-ignore Leaflet typings are wrong
    if (!visibility && this.getParent().getLayerGroup().hasLayer(this.#point)) this.#point.removeFrom(this.getParent().getLayerGroup());

    if (visibility && !this.getParent().getVisibility()) this.getParent().setVisibility(true);

    getApp().getDrawingsManager().requestUpdateEventDispatch();
  }

  getOpacity(): number {
    return this.#point.options.opacity ?? 1;
  }

  getVisibility(): boolean {
    return this.getParent().getLayerGroup().hasLayer(this.#point);
  }
}

export class DCSDrawingsContainer {
  #drawings: DCSDrawing[] = [];
  #subContainers: DCSDrawingsContainer[] = [];
  #name: string;
  #opacity: number = 1;
  #visibility: boolean = true;
  #layerGroup: LayerGroup = new LayerGroup();
  #parent: LayerGroup | DCSDrawingsContainer;
  #guid: string = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);

  constructor(name: string, parent: LayerGroup | DCSDrawingsContainer) {
    this.#name = name;
    this.#parent = parent;
    this.#layerGroup.addTo(parent instanceof DCSDrawingsContainer ? parent.getLayerGroup() : parent);
  }

  getGuid() {
    return this.#guid;
  }

  initFromData(drawingsData) {
    let hasContainers = false;
    Object.keys(drawingsData).forEach((layerName: string) => {
      if (layerName === 'navpoints') {
        return;
      }
      if (drawingsData[layerName]["name"] === undefined) {
        const newContainer = new DCSDrawingsContainer(layerName, this);
        this.addSubContainer(newContainer);
        newContainer.initFromData(drawingsData[layerName]);
        hasContainers = true;
      }
    });
    const othersContainer = new DCSDrawingsContainer("Others", this);
    if (hasContainers) this.addSubContainer(othersContainer);

    Object.keys(drawingsData).forEach((layerName: string) => {
      const primitiveType = drawingsData[layerName]["primitiveType"];
      const isANavpoint = !!drawingsData[layerName]['callsignStr'];

      // Possible primitives:
      // "Line","TextBox","Polygon","Icon"

      // Possible polygon modes:
      // "arrow","circle","rect","oval","free"

      // Possible Line modes:
      // 'segments', 'free', 'segment'

      let newDrawing = new DCSEmptyLayer(drawingsData[layerName], othersContainer) as DCSDrawing;

      if (isANavpoint) {
        newDrawing = new DCSNavpoint(drawingsData[layerName], othersContainer);
        this.addDrawing(newDrawing);
        return;
      }

      switch (primitiveType) {
        case "Polygon":
          newDrawing = new DCSPolygon(drawingsData[layerName], othersContainer);
          break;
        case "TextBox":
          newDrawing = new DCSTextBox(drawingsData[layerName], othersContainer);
          break;
        case "Line":
          newDrawing = new DCSLine(drawingsData[layerName], othersContainer);
          break;
        case "Icon":
          break;
        default:
          break;
      }
      if (hasContainers) othersContainer.addDrawing(newDrawing);
      else this.addDrawing(newDrawing);
    });

    if (othersContainer.getDrawings().length === 0) this.removeSubContainer(othersContainer); // Remove empty container
  }

  initNavpoints(drawingsData) {
    const newContainer = new DCSDrawingsContainer('Navpoints', this);
    this.addSubContainer(newContainer);
    newContainer.initFromData(drawingsData);
  }

  getLayerGroup() {
    return this.#layerGroup;
  }

  getName() {
    return this.#name;
  }

  addDrawing(drawing: DCSDrawing) {
    this.#drawings.push(drawing);
  }

  addSubContainer(container: DCSDrawingsContainer) {
    this.#subContainers.push(container);
  }

  removeSubContainer(container: DCSDrawingsContainer) {
    const index = this.#subContainers.indexOf(container);
    if (index !== -1) this.#subContainers.splice(index, 1);
  }

  getDrawings() {
    return this.#drawings;
  }

  getSubContainers() {
    return this.#subContainers;
  }

  setOpacity(opacity: number) {
    if (opacity === this.#opacity) return;

    this.#opacity = opacity;
    this.#drawings.forEach((drawing) => drawing.setOpacity(opacity));
    this.#subContainers.forEach((container) => container.setOpacity(opacity));

    getApp().getDrawingsManager().requestUpdateEventDispatch();
  }

  setVisibility(visibility: boolean, force: boolean = false) {
    this.#visibility = visibility;

    if (force) {
      this.#subContainers.forEach((container) => container.setVisibility(visibility, force));
      this.#drawings.forEach((drawing) => drawing.setVisibility(visibility));
    }
    if (visibility && this.#parent instanceof DCSDrawingsContainer && !this.#parent.getVisibility()) this.#parent.setVisibility(true);

    if (this.#parent instanceof DCSDrawingsContainer) {
      if (visibility && !this.#parent.getLayerGroup().hasLayer(this.#layerGroup)) this.#layerGroup.addTo(this.#parent.getLayerGroup());
      //@ts-ignore Leaflet typings are wrong
      if (!visibility && this.#parent.getLayerGroup().hasLayer(this.#layerGroup)) this.#layerGroup.removeFrom(this.#parent.getLayerGroup());
    } else {
      if (visibility && !this.#parent.hasLayer(this.#layerGroup)) this.#layerGroup.addTo(this.#parent);
      //@ts-ignore Leaflet typings are wrong
      if (!visibility && this.#parent.hasLayer(this.#layerGroup)) this.#layerGroup.removeFrom(this.#parent);
    }

    getApp().getDrawingsManager().requestUpdateEventDispatch();
  }

  getOpacity() {
    return this.#opacity;
  }

  getVisibility() {
    return this.#visibility;
  }

  toJSON() {
    let JSON = { drawings: {}, containers: {}, guid: this.#guid, name: this.#name, opacity: this.#opacity, visibility: this.#visibility };
    this.#drawings.forEach((drawing) => {
      JSON["drawings"][drawing.getName()] = drawing.toJSON();
    });
    this.#subContainers.forEach((container) => {
      JSON["containers"][container.getName()] = container.toJSON();
    });
    return JSON;
  }

  fromJSON(JSON) {
    this.#subContainers.forEach((container) => {
      if (JSON["containers"][container.getName()]) container.fromJSON(JSON["containers"][container.getName()]);
    });
    this.#drawings.forEach((drawing) => {
      if (JSON["drawings"][drawing.getName()]) {
        drawing.setOpacity(JSON["drawings"][drawing.getName()].opacity);
        drawing.setVisibility(JSON["drawings"][drawing.getName()].visibility);
      }
    });
    this.setOpacity(JSON["opacity"]);
    this.setVisibility(JSON["visibility"]);
  }

  hasSearchString(searchString) {
    if (this.getName().toLowerCase().includes(searchString.toLowerCase())) return true;
    if (
      this.getDrawings().some((drawing) =>
        drawing
          .getName()
          ?.toLowerCase()
          .includes(searchString.toLowerCase() ?? false)
      )
    )
      return true;
    if (this.getSubContainers().some((container) => container.hasSearchString(searchString))) return true;
    return false;
  }
}

export class DrawingsManager {
  #drawingsContainer: DCSDrawingsContainer;
  #updateEventRequested: boolean = false;
  #sessionDataDrawings = {};
  #initialized: boolean = false;

  constructor() {
    const drawingsLayerGroup = new LayerGroup();
    drawingsLayerGroup.addTo(getApp().getMap());
    this.#drawingsContainer = new DCSDrawingsContainer("Mission drawings", drawingsLayerGroup);

    MapOptionsChangedEvent.on((mapOptions: MapOptions) => {
      this.#drawingsContainer.setVisibility(mapOptions.showMissionDrawings);
    });

    SessionDataLoadedEvent.on((sessionData) => {
      this.#sessionDataDrawings = sessionData.drawings ?? {};
      if (this.#initialized) if (this.#sessionDataDrawings["Mission drawings"]) this.#drawingsContainer.fromJSON(this.#sessionDataDrawings["Mission drawings"]);
    });
  }

  initDrawings(data: { drawings: Record<string, Record<string, any>> }): boolean {
    if (data && data.drawings) {
      this.#drawingsContainer.initFromData(data.drawings);
      if (data.drawings.navpoints) this.#drawingsContainer.initNavpoints(data.drawings.navpoints);
      if (this.#sessionDataDrawings["Mission drawings"]) this.#drawingsContainer.fromJSON(this.#sessionDataDrawings["Mission drawings"]);
      DrawingsInitEvent.dispatch(this.#drawingsContainer);
      this.#initialized = true;
      return true;
    } else {
      console.error("Error while initializing drawings, empty data");
      return false;
    }
  }

  getDrawingsContainer() {
    return this.#drawingsContainer;
  }

  requestUpdateEventDispatch() {
    if (this.#updateEventRequested) return;
    this.#updateEventRequested = true;
    window.setTimeout(() => {
      this.#updateEventRequested = false;
      DrawingsUpdatedEvent.dispatch();
    }, 100);
  }
}
