(function()
{
	createNamespace("TF.RoutingPalette.FieldTripMap").PathGraphicWrapper = PathGraphicWrapper;

	function PathGraphicWrapper() {}

	PathGraphicWrapper.CreatePath = function(paths, attributes, visible = true)
	{
		const color = attributes.Color;
		const symbol = getPathSymbol(color);
		return getPolylineGraphic(paths, symbol, attributes, visible);
	}

	PathGraphicWrapper.CreateHighlightBackgroundPath = function(paths, attributes)
	{
		const color = [253, 245, 53, 0.7];
		const symbol = getPathSymbol(color);
		symbol.width = symbol.width + 4;

		return getPolylineGraphic(paths, symbol, attributes);
	}

	PathGraphicWrapper.GetSymbol = function(color)
	{
		return getPathSymbol(color);
	}

	const getPolylineGraphic = (paths, symbol, attributes, visible = true) =>
	{
		const polyline = new TF.GIS.SDK.Polyline({
			hasZ: false,
			hasM: false,
			paths: paths,
			spatialReference: { wkid: 4326 }
		});
		const geometry = TF.GIS.SDK.webMercatorUtils.geographicToWebMercator(polyline);

		return new TF.GIS.SDK.Graphic({ geometry, symbol, attributes, visible });
	};

	const getPathSymbol = (color) =>
	{
		let symbolHelper = new TF.Map.Symbol();
		const pathSymbol = symbolHelper.tripPath(color);

		symbolHelper.dispose();
		symbolHelper = null;

		return pathSymbol;
	};

})();