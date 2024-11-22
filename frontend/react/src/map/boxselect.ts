import { Handler } from "leaflet";
import { Util } from "leaflet";
import { DomUtil } from "leaflet";
import { DomEvent } from "leaflet";
import { LatLngBounds } from "leaflet";
import { Bounds } from "leaflet";
import { SELECT_TOLERANCE_PX } from "../constants/constants";
import { Map } from "./map";

export var BoxSelect = Handler.extend({
  initialize: function (map: Map) {
    this._map = map;
    this._container = map.getContainer();
    this._pane = map.getPanes().overlayPane;
    this._resetStateTimeout = 0;
    map.on("unload", this._destroy, this);
  },

  addHooks: function () {
    DomEvent.on(this._container, "mousedown", this._onMouseDown, this);
  },

  removeHooks: function () {
    DomEvent.off(this._container, "mousedown", this._onMouseDown, this);
  },

  moved: function () {
    return this._moved;
  },

  _destroy: function () {
    DomUtil.remove(this._pane);
    delete this._pane;
  },

  _resetState: function () {
    this._resetStateTimeout = 0;
    this._moved = false;
  },

  _clearDeferredResetState: function () {
    if (this._resetStateTimeout !== 0) {
      clearTimeout(this._resetStateTimeout);
      this._resetStateTimeout = 0;
    }
  },

  _onMouseDown: function (e: any) {
    if (this._map.getEnableSelection() && e.button == 0) {
      // Clear the deferred resetState if it hasn't executed yet, otherwise it
      // will interrupt the interaction and orphan a box element in the container.
      this._clearDeferredResetState();
      this._resetState();

      DomUtil.disableImageDrag();
      this._map.dragging.disable();

      if (e.type === "touchstart") this._startPoint = this._map.mouseEventToContainerPoint(e.touches[0]);
      else this._startPoint = this._map.mouseEventToContainerPoint(e);

      DomEvent.on(
        //@ts-ignore
        document,
        {
          contextmenu: DomEvent.stop,
          touchmove: this._onMouseMove,
          touchend: this._onMouseUp,
          mousemove: this._onMouseMove,
          mouseup: this._onMouseUp
        },
        this
      );
    } else {
      return false;
    }
  },

  _onMouseUp: function (e: any) {
    if (e.button !== 0) {
      return;
    }

    this._finish();

    if (!this._moved) {
      return;
    }
    // Postpone to next JS tick so internal click event handling
    // still see it as "moved".
    window.setTimeout(Util.bind(this._resetState, this), 0);
    var bounds = new LatLngBounds(this._map.containerPointToLatLng(this._startPoint), this._map.containerPointToLatLng(this._point));

    this._map.fire("selectionend", { selectionBounds: bounds });
  },

  _onMouseMove: function (e: any) {
    if (e.type === "touchmove") this._point = this._map.mouseEventToContainerPoint(e.touches[0]);
    else this._point = this._map.mouseEventToContainerPoint(e);

    if (
      Math.abs(this._startPoint.x - this._point.x) < SELECT_TOLERANCE_PX &&
      Math.abs(this._startPoint.y - this._point.y) < SELECT_TOLERANCE_PX &&
      !this._moved
    )
      return;

    if (!this._moved) {
      this._map.fire("selectionstart");
      this._moved = true;
      this._box = DomUtil.create("div", "leaflet-zoom-box", this._container);
      DomUtil.addClass(this._container, "leaflet-crosshair");
    }

    var bounds = new Bounds(this._point, this._startPoint),
      size = bounds.getSize();

    if (bounds.min != undefined) DomUtil.setPosition(this._box, bounds.min);

    this._box.style.width = size.x + "px";
    this._box.style.height = size.y + "px";
  },

  _finish: function () {
    if (this._moved) {
      DomUtil.remove(this._box);
      DomUtil.removeClass(this._container, "leaflet-crosshair");
    }

    DomUtil.enableImageDrag();
    this._map.dragging.enable();

    DomEvent.off(
      //@ts-ignore
      document,
      {
        contextmenu: DomEvent.stop,
        touchmove: this._onMouseMove,
        touchend: this._onMouseUp,
        mousemove: this._onMouseMove,
        mouseup: this._onMouseUp,
      },
      this
    );
  },
});
