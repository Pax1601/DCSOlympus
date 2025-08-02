import { DomEvent, LeafletMouseEvent, Point } from "leaflet";
import { Map } from "./map";

enum MapMouseHandlerState {
  IDLE = "IDLE",
  LEFT_MOUSE_DOWN = "Left mouse down",
  MOUSE_WHEEL_DOWN = "Mouse wheel down",
  RIGHT_MOUSE_DOWN = "Right mouse down",
  DEBOUNCING = "Debouncing",
}

export class MapMouseHandler {
  #map: Map;
  #state: string = MapMouseHandlerState.IDLE;
  #leftMouseDownEpoch: number = 0;
  #rightMouseDownEpoch: number = 0;
  #mouseWheelDownEpoch: number = 0;
  #leftMouseDownTimeout: number | null = null;
  #rightMouseDownTimeout: number | null = null;
  #mouseWheelDownTimeout: number | null = null;

  #debounceTimeout: number | null = null;

  leftMousePressed: (event: LeafletMouseEvent) => void = () => {};
  leftMouseReleased: (event: LeafletMouseEvent) => void = () => {};
  rightMousePressed: (event: LeafletMouseEvent) => void = () => {};
  rightMouseReleased: (event: LeafletMouseEvent) => void = () => {};
  mouseWheelPressed: (event: LeafletMouseEvent) => void = () => {};
  mouseWheelReleased: (event: LeafletMouseEvent) => void = () => {};

  leftMouseDoubleClick: (event: LeafletMouseEvent) => void = () => {};

  leftMouseShortClick: (event: LeafletMouseEvent) => void = () => {};
  rightMouseShortClick: (event: LeafletMouseEvent) => void = () => {};
  mouseWheelShortClick: (event: LeafletMouseEvent) => void = () => {};
  leftMouseLongClick: (event: LeafletMouseEvent) => void = () => {};
  rightMouseLongClick: (event: LeafletMouseEvent) => void = () => {};
  mouseWheelLongClick: (event: LeafletMouseEvent) => void = () => {};

  mouseMove: (event: LeafletMouseEvent) => void = () => {};

  mouseWheel: (event: LeafletMouseEvent) => void = () => {};

  constructor(map) {
    this.#map = map;

    /* Events for touchscreen and mouse */
    if ("ontouchstart" in window) {
      DomEvent.on(this.#map.getContainer(), "touchstart", (e: any) => this.#onTouchStart(e), this);
      DomEvent.on(this.#map.getContainer(), "touchend", (e: any) => this.#onTouchEnd(e), this);
      DomEvent.on(this.#map.getContainer(), "touchmove", (e: any) => this.#onTouchMove(e), this);
    } else {
      this.#map.on("mouseup", (e: any) => this.#onMouseUp(e));
      this.#map.on("mousedown", (e: any) => this.#onMouseDown(e));
      this.#map.on("mousemove", (e: any) => this.#onMouseMove(e));
    }
    this.#map.on("dblclick", (e: any) => this.#onDoubleClick(e));

    /* Disable unwanted events */
    this.#map.on("click", (e: any) => e.originalEvent.preventDefault());
    this.#map.on("contextmenu", (e: any) => e.originalEvent.preventDefault());

    /* Mouse wheel event */
    DomEvent.on(this.#map.getContainer(), "wheel", (e: any) => this.#onMouseWheel(e), this);
  }

  setState(state: string) {
    console.log("MouseHandler switching state from", this.#state, "to", state);
    this.#state = state;
  }

  stopEvents() {
    if (this.#leftMouseDownTimeout) {
      clearTimeout(this.#leftMouseDownTimeout);
      this.#leftMouseDownTimeout = null;
    }
    if (this.#rightMouseDownTimeout) {
      clearTimeout(this.#rightMouseDownTimeout);
      this.#rightMouseDownTimeout = null;
    }
    if (this.#debounceTimeout) {
      clearTimeout(this.#debounceTimeout);
      this.#debounceTimeout = null;
    }

    this.setState(MapMouseHandlerState.IDLE);
  }

  #onMouseDown = (e: LeafletMouseEvent) => {
    if (e.originalEvent.button === 0) {
      this.leftMousePressed(e);
      this.setState(MapMouseHandlerState.LEFT_MOUSE_DOWN);
      this.#leftMouseDownEpoch = Date.now();
      this.#leftMouseDownTimeout = window.setTimeout(() => {
        this.leftMouseLongClick(e);
        this.#leftMouseDownTimeout = null;
      }, 300);
    } else if (e.originalEvent.button === 1) {
      this.mouseWheelPressed(e);
      this.setState(MapMouseHandlerState.MOUSE_WHEEL_DOWN);
      this.#mouseWheelDownEpoch = Date.now();
      this.#mouseWheelDownTimeout = window.setTimeout(() => {
        this.mouseWheelLongClick(e);
        this.#mouseWheelDownTimeout = null;
      }, 300);
    } else if (e.originalEvent.button === 2) {
      this.rightMousePressed(e);
      this.setState(MapMouseHandlerState.RIGHT_MOUSE_DOWN);
      this.#rightMouseDownEpoch = Date.now();
      this.#rightMouseDownTimeout = window.setTimeout(() => {
        this.rightMouseLongClick(e);
        this.#rightMouseDownTimeout = null;
      }, 300);
    }
  };

  #onMouseUp = (e: LeafletMouseEvent) => {
    if (this.#leftMouseDownTimeout) {
      clearTimeout(this.#leftMouseDownTimeout);
      this.#leftMouseDownTimeout = null;
    }
    if (this.#rightMouseDownTimeout) {
      clearTimeout(this.#rightMouseDownTimeout);
      this.#rightMouseDownTimeout = null;
    }
    if (this.#rightMouseDownTimeout) {
      clearTimeout(this.#rightMouseDownTimeout);
      this.#rightMouseDownTimeout = null;
    }

    if (this.#state === MapMouseHandlerState.LEFT_MOUSE_DOWN) {
      this.leftMouseReleased(e);
      if (Date.now() - this.#leftMouseDownEpoch < 300) {
        this.setState(MapMouseHandlerState.DEBOUNCING);
        this.#debounceTimeout = window.setTimeout(() => {
          this.leftMouseShortClick(e);
        }, 300);
      }
    } else if (this.#state === MapMouseHandlerState.MOUSE_WHEEL_DOWN) {
      this.mouseWheelReleased(e);
      if (Date.now() - this.#mouseWheelDownEpoch < 300) {
        this.mouseWheelShortClick(e);
      }
    } else if (this.#state === MapMouseHandlerState.RIGHT_MOUSE_DOWN) {
      this.rightMouseReleased(e);
      if (Date.now() - this.#rightMouseDownEpoch < 300) {
        this.rightMouseShortClick(e);
      }
    }

    this.setState(MapMouseHandlerState.IDLE);
  };

  #onDoubleClick = (e: LeafletMouseEvent) => {
    this.leftMouseDoubleClick(e);
    if (this.#debounceTimeout) {
      clearTimeout(this.#debounceTimeout);
    }
  };

  #onMouseWheel = (e: LeafletMouseEvent) => {
    this.mouseWheel(e);
  };

  #onTouchStart = (e: TouchEvent) => {
    let newEvent = {
      latlng: this.#map.containerPointToLatLng(this.#map.mouseEventToContainerPoint(e.changedTouches[0] as unknown as MouseEvent)),
      originalEvent: e,
    } as unknown as LeafletMouseEvent;

    this.leftMousePressed(newEvent);
    this.setState(MapMouseHandlerState.LEFT_MOUSE_DOWN);
    this.#leftMouseDownEpoch = Date.now();
    this.#leftMouseDownTimeout = window.setTimeout(() => {
      this.leftMouseLongClick(newEvent);
      this.#leftMouseDownTimeout = null;
    }, 300);
  };

  #onTouchEnd = (e: TouchEvent) => {
    let newEvent = {
      latlng: this.#map.containerPointToLatLng(this.#map.mouseEventToContainerPoint(e.changedTouches[0] as unknown as MouseEvent)),
      originalEvent: e,
    } as unknown as LeafletMouseEvent;

    if (this.#leftMouseDownTimeout) {
      clearTimeout(this.#leftMouseDownTimeout);
      this.#leftMouseDownTimeout = null;
    }

    if (this.#state === MapMouseHandlerState.LEFT_MOUSE_DOWN) {
      this.leftMouseReleased(newEvent);
      if (Date.now() - this.#leftMouseDownEpoch < 300) {
        this.#debounceTimeout = window.setTimeout(() => {
          this.leftMouseShortClick(newEvent);
        }, 300);
      }
    }

    this.setState(MapMouseHandlerState.IDLE);
  };

  #onMouseMove = (e: LeafletMouseEvent) => {
    this.mouseMove(e);
  };

  #onTouchMove = (e: TouchEvent) => {
    let newEvent = {
      latlng: this.#map.containerPointToLatLng(this.#map.mouseEventToContainerPoint(e.changedTouches[0] as unknown as MouseEvent)),
      originalEvent: e,
    } as unknown as LeafletMouseEvent;

    this.mouseMove(newEvent);
  };
}
