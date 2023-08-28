(function()
{
	createNamespace("TF.GIS").GeometryHelper = GeometryHelper;

	function GeometryHelper() { }

	GeometryHelper.CreatePointGeometry = function(longitude, latitude, wkid = 4326)
	{
		return new TF.GIS.SDK.Point({
			type: "point",
			x: longitude,
			y: latitude,
			spatialReference: { wkid }
		});
	}

	GeometryHelper.CreateWebMercatorPoint = function(x, y)
	{
		return GeometryHelper.CreatePointGeometry(x, y, 102100);
	}

	GeometryHelper.ComputeWebMercatorPoint = function(longitude, latitude)
	{
		const point = GeometryHelper.CreatePointGeometry(longitude, latitude);
		return TF.GIS.SDK.webMercatorUtils.geographicToWebMercator(point);
	}

	GeometryHelper.CreatePolylineGeometry = function(paths, wkid = 4326)
	{
		return new TF.GIS.SDK.Polyline({
			hasZ: false,
			hasM: false,
			paths: paths,
			spatialReference: { wkid }
		});
	}

	GeometryHelper.CreateWebMercatorPolyline = function(paths)
	{
		return GeometryHelper.CreatePolylineGeometry(paths, 102100);
	}

	GeometryHelper.ComputeWebMercatorPolyline = function(paths)
	{
		const polyline = GeometryHelper.CreatePolylineGeometry(paths);
		return TF.GIS.SDK.webMercatorUtils.geographicToWebMercator(polyline);
	}

	GeometryHelper.SimplifyGeometry = function(geometry)
	{
		return TF.GIS.SDK.geometryEngine.simplify(geometry);
	}

})();