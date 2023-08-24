(function()
{
	createNamespace("TF.GIS").GeometryHelper = GeometryHelper;

	function GeometryHelper() { }

	GeometryHelper.CreatePointGeometry = function(longitude, latitude)
	{
		return new TF.GIS.SDK.Point({
			type: "point",
			x: longitude,
			y: latitude,
			spatialReference: { wkid: 4326 }
		});
	}

})();