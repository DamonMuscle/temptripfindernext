(function()
{
	var WaterHelper = {};
	createNamespace("TF.RoutingMap.MapEditingPalette").WaterHelper = WaterHelper;

	WaterHelper.addLayer = function(id, viewModel, map)
	{
		var layer = new tf.map.ArcGIS.GraphicsLayer({ "id": id });
		viewModel.layers.push(id);
		map.addLayer(layer);
		return layer;
	};

	WaterHelper.setValue = function(source, key, toData)
	{
		if (ko.isObservable(source[key]))
		{
			toData[key] = source[key]();
		} else if (key != "geometry")
		{
			toData[key] = source[key];
		}
	};

})();

