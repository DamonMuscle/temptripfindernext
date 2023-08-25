(function()
{
	createNamespace("TF.RoutingPalette.FieldTripMap").StopGraphicWrapper = StopGraphicWrapper;

	function StopGraphicWrapper() { }

	StopGraphicWrapper.CreateStop = function(longitude, latitude, attributes = null, sequence = null, visible = true)
	{
		const DEFAULT_STOP_COLOR = "#FFFFFF", DEFAULT_STOP_SEQUENCE = 0;
		const color = attributes?.Color || DEFAULT_STOP_COLOR;
		const stopSequence = sequence || attributes?.Sequence || DEFAULT_STOP_SEQUENCE;
		const symbol = getStopSymbol(stopSequence, color);

		return getPointGraphic(longitude, latitude, symbol, attributes, visible);
	}

	StopGraphicWrapper.CreateHighlightBackgroundStop = function(longitude, latitude, attributes)
	{
		const color = [253, 245, 53, 0.7];
		const symbol = {
			type: "simple-marker",
			color: color,
			size: 32,
			outline: null
		};

		return getPointGraphic(longitude, latitude, symbol, attributes);
	}

	StopGraphicWrapper.GetHighlightStopSymbol = function(sequence)
	{
		const HIGHLIGHT_STOP_COLOR = "#FFFFFF";
		return getStopSymbol(sequence, HIGHLIGHT_STOP_COLOR);
	}

	const getPointGraphic = (longitude, latitude, symbol, attributes, visible = true) =>
	{
		const point = TF.GIS.GeometryHelper.CreatePointGeometry(longitude, latitude);
		const geometry = TF.GIS.SDK.webMercatorUtils.geographicToWebMercator(point);

		return new TF.GIS.SDK.Graphic({ geometry, symbol, attributes, visible });
	};

	const getStopSymbol = (sequence, color) =>
	{
		let symbolHelper = new TF.Map.Symbol();
		const stopSymbol = symbolHelper.tripStop(sequence, color);

		symbolHelper.dispose();
		symbolHelper = null;

		return stopSymbol;
	};

})();