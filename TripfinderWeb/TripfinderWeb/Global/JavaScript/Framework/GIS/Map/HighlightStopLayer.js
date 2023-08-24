(function()
{
	createNamespace("TF.GIS.Layer").HighlightStopLayer = HighlightStopLayer;

	function HighlightStopLayer(options)
	{
		const self = this;
		TF.GIS.Layer.StopLayer.call(self, options);
	}

	HighlightStopLayer.prototype = Object.create(TF.GIS.Layer.StopLayer.prototype);
	HighlightStopLayer.prototype.constructor = HighlightStopLayer;

	HighlightStopLayer.prototype.createBackgroundStop = function(longitude, latitude, attributes)
	{
		const color = [253, 245, 53, 0.7];
		const symbol = {
			type: "simple-marker",
			color: color,
			size: 32,
			outline: null
		};
		const graphic = this.createPointGraphic(longitude, latitude, symbol, attributes);
		return graphic;
	}

	HighlightStopLayer.prototype.getStopSymbol = function(sequence)
	{
		const HIGHLIGHT_STOP_COLOR = "#FFFFFF";
		return this.symbolHelper.tripStop(sequence, HIGHLIGHT_STOP_COLOR);
	}

})();