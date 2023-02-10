(function()
{
	createNamespace("TF.RoutingMap.MapEditingPalette").MapEditingPaletteDataModel = MapEditingPaletteDataModel;

	function MapEditingPaletteDataModel(viewModel)
	{
		var self = this;
		this.viewModel = viewModel;
		this.arcgis = tf.map.ArcGIS;


	}

	// $.extend(createNamespace("TF.RoutingMap.BoundaryPalette"), {
	// 	FillPattern: { None: 0, SemiTransparent: 1, Solid: 2 },
	// 	Type: { SchoolBoundary: "SchoolBoundary", PopulationRegion: "PopulationRegion" }
	// })

	MapEditingPaletteDataModel.prototype.init = function(arcgis)
	{

	}

	MapEditingPaletteDataModel.prototype.dispose = function()
	{

	}
})();
