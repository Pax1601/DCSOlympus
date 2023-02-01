import { Map } from 'leaflet';
import { Handler} from 'leaflet';
import { Util } from 'leaflet';
import { DomUtil } from 'leaflet';
import { DomEvent } from 'leaflet';
import { LatLngBounds } from 'leaflet';
import { Bounds }  from 'leaflet';

export var BoxSelect = Handler.extend({
	initialize: function (map: Map) {
		this._map = map;
		this._container = map.getContainer();
		this._pane = map.getPanes().overlayPane;
		this._resetStateTimeout = 0;
		map.on('unload', this._destroy, this);
	},

	addHooks: function () {
		DomEvent.on(this._container, 'mousedown', this._onMouseDown, this);
	},

	removeHooks: function () {
		DomEvent.off(this._container, 'mousedown', this._onMouseDown, this);
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
		if (((e.which !== 1) && (e.button !== 0))) { return false; }

		// Clear the deferred resetState if it hasn't executed yet, otherwise it
		// will interrupt the interaction and orphan a box element in the container.
		this._clearDeferredResetState();
		this._resetState();

		DomUtil.disableTextSelection();
		DomUtil.disableImageDrag();

		this._startPoint = this._map.mouseEventToContainerPoint(e);

		//@ts-ignore
		DomEvent.on(document, {
			contextmenu: DomEvent.stop,
			mousemove: this._onMouseMove,
			mouseup: this._onMouseUp,
			keydown: this._onKeyDown
		}, this);
	},

	_onMouseMove: function (e: any) {
		if (!this._moved) {
			this._moved = true;

			this._box = DomUtil.create('div', 'leaflet-zoom-box', this._container);
			DomUtil.addClass(this._container, 'leaflet-crosshair');

			this._map.fire('boxzoomstart');
		}

		this._point = this._map.mouseEventToContainerPoint(e);

		var bounds = new Bounds(this._point, this._startPoint),
		    size = bounds.getSize();

		if (bounds.min != undefined)
			DomUtil.setPosition(this._box, bounds.min);

		this._box.style.width  = size.x + 'px';
		this._box.style.height = size.y + 'px';
	},

	_finish: function () {
		if (this._moved) {
			DomUtil.remove(this._box);
			DomUtil.removeClass(this._container, 'leaflet-crosshair');
		}

		DomUtil.enableTextSelection();
		DomUtil.enableImageDrag();

		//@ts-ignore
		DomEvent.off(document, {
			contextmenu: DomEvent.stop,
			mousemove: this._onMouseMove,
			mouseup: this._onMouseUp,
			keydown: this._onKeyDown
		}, this);
	},

	_onMouseUp: function (e: any) {
		if ((e.which !== 1) && (e.button !== 0)) { return; }

		this._finish();
        
		if (!this._moved) { return; }
		// Postpone to next JS tick so internal click event handling
		// still see it as "moved".
		setTimeout(Util.bind(this._resetState, this), 0);
		var bounds = new LatLngBounds(
			this._map.containerPointToLatLng(this._startPoint),
			this._map.containerPointToLatLng(this._point));
	
		this._map.fire('selectionend', {selectionBounds: bounds});
	},

	_onKeyDown: function (e: any) {
		if (e.keyCode === 27) {
			this._finish();
			this._clearDeferredResetState();
			this._resetState();
		}
	}
});

