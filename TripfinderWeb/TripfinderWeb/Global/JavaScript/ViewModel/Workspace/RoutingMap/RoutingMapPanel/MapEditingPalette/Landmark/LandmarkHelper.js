(function()
{
	var LandmarkHelper = {};
	createNamespace("TF.RoutingMap.MapEditingPalette").LandmarkHelper = LandmarkHelper;

	LandmarkHelper.addLayer = function(id, viewModel, map)
	{
		var layer = new tf.map.ArcGIS.GraphicsLayer({ "id": id });
		viewModel.layers.push(id);
		map.addLayer(layer);
		return layer;
	};

	LandmarkHelper.setValue = function(source, key, toData)
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

