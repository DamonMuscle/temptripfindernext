(function()
{
	var RailroadHelper = {}
	createNamespace("TF.RoutingMap.MapEditingPalette").RailroadHelper = RailroadHelper;

	RailroadHelper.addLayer = function(id, viewModel, map)
	{
		var layer = new tf.map.ArcGIS.GraphicsLayer({ 'id': id });
		viewModel.layers.push(id)
		map.addLayer(layer)
		return layer;
	}

	RailroadHelper.mapSourceToAll = function(source, all)
	{
		for (var i = 0; i < source.length; i++)
		{
			all[source[i].id] = source[i];
		}
	}

	RailroadHelper.setValue = function(source, key, toData)
	{
		if (ko.isObservable(source[key]))
		{
			toData[key] = source[key]();
		} else
		{
			toData[key] = source[key];
		}
	}

})();

