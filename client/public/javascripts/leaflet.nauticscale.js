L.Control.ScaleNautic = L.Control.Scale.extend({
	options: {
		nautic: false
	},

	_addScales: function(options, className, container) {
		L.Control.Scale.prototype._addScales.call(this, options, className, container);
		L.setOptions(options);
		if (this.options.nautic) {
			this._nScale = L.DomUtil.create('div', className, container);
		}
	},

	_updateScales: function (maxMeters) {
		L.Control.Scale.prototype._updateScales.call(this, maxMeters);
		if (this.options.nautic && maxMeters) {
			this._updateNautic(maxMeters);
		}
	},

	_updateNautic: function (maxMeters) {
		var scale = this._nScale,
			maxNauticalMiles = maxMeters / 1852, nauticalMiles;

		if(maxMeters >= 1852) {
			nauticalMiles = L.Control.Scale.prototype._getRoundNum.call(this, maxNauticalMiles);
		} else {
			nauticalMiles = maxNauticalMiles > 0.1 ? Math.round(maxNauticalMiles * 10) / 10 : Math.round(maxNauticalMiles * 100) / 100;
		}

		scale.style.width = Math.round(this.options.maxWidth * (nauticalMiles / maxNauticalMiles)) - 10 + 'px';
		scale.innerHTML = nauticalMiles + ' nm';
	}
});

L.control.scalenautic = function (options) {
	return new L.Control.ScaleNautic(options);
};
