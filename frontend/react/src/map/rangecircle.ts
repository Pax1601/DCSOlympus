// @ts-nocheck <-- This is a horrible hack. But it is needed at the moment to ovveride a default behaviour of Leaflet. TODO please fix me the proper way.

import { Circle, Point, Polyline } from "leaflet";

/**
 *  This custom Circle object implements a faster render method for very big circles. When zoomed in, the default ctx.arc method
 * is very slow since the circle is huge. Also, when zoomed in most of the circle points will be outside the screen and not needed. This
 * simpler, faster renderer approximates the circle with line segements and only draws those currently visibile.
 * A more refined version using arcs could be implemented but this works good enough.
 */
export class RangeCircle extends Circle {
  _updatePath() {
    if (!this._renderer._drawing || this._empty()) {
      return;
    }
    var p = this._point,
      ctx = this._renderer._ctx,
      r = Math.max(Math.round(this._radius), 1),
      s = (Math.max(Math.round(this._radiusY), 1) || r) / r;

    if (s !== 1) {
      ctx.save();
      ctx.scale(1, s);
    }

    let pathBegun = false;
    let dtheta = (Math.PI * 2) / 120;
    for (let theta = 0; theta <= Math.PI * 2; theta += dtheta) {
      let p1 = new Point(p.x + r * Math.cos(theta), p.y / s + r * Math.sin(theta));
      let p2 = new Point(p.x + r * Math.cos(theta + dtheta), p.y / s + r * Math.sin(theta + dtheta));
      let l1 = this._map.layerPointToLatLng(p1);
      let l2 = this._map.layerPointToLatLng(p2);
      let line = new Polyline([l1, l2]);
      if (this._map.getBounds().intersects(line.getBounds())) {
        if (!pathBegun) {
          ctx.beginPath();
          ctx.moveTo(p1.x, p1.y);
          pathBegun = true;
        }
        ctx.lineTo(p2.x, p2.y);
      } else {
        if (pathBegun) {
          this._renderer._fillStroke(ctx, this);
          pathBegun = false;
        }
      }
    }

    if (pathBegun) this._renderer._fillStroke(ctx, this);

    if (s !== 1) ctx.restore();
  }
}
