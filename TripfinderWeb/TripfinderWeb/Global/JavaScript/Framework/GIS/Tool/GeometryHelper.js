(function()
{
	createNamespace("TF.GIS").GeometryHelper = GeometryHelper;

	function GeometryHelper() { }

	GeometryHelper.CreatePointGeometry = function(longitude, latitude, wkid = TF.GIS.GeometryEnum.WKID.WGS_1984)
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
		return GeometryHelper.CreatePointGeometry(x, y, TF.GIS.GeometryEnum.WKID.WEB_MERCATOR);
	}

	GeometryHelper.ComputeWebMercatorPoint = function(longitude, latitude)
	{
		const point = GeometryHelper.CreatePointGeometry(longitude, latitude);
		return GeometryHelper.ConvertToWebMercator(point);
	}

	GeometryHelper.CreatePolylineGeometry = function(paths, wkid = TF.GIS.GeometryEnum.WKID.WGS_1984)
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
		return GeometryHelper.CreatePolylineGeometry(paths, TF.GIS.GeometryEnum.WKID.WEB_MERCATOR);
	}

	GeometryHelper.ComputeWebMercatorPolyline = function(paths)
	{
		const polyline = GeometryHelper.CreatePolylineGeometry(paths);
		return GeometryHelper.ConvertToWebMercator(polyline);
	}

	GeometryHelper.ConvertToWebMercator = function(geometry)
	{
		return TF.GIS.SDK.webMercatorUtils.geographicToWebMercator(geometry);
	}

	GeometryHelper.ConvertToWGS1984 = function(geometry)
	{
		return TF.GIS.SDK.webMercatorUtils.webMercatorToGeographic(geometry);
	}

	//#region geometryEngine

	GeometryHelper.SimplifyGeometry = function(geometry)
	{
		return TF.GIS.SDK.geometryEngine.simplify(geometry);
	}

	GeometryHelper.ComputePolylineGeodesicLength = function(polyline)
	{
		return TF.GIS.SDK.geometryEngine.geodesicLength(polyline, "meters");
	}

	GeometryHelper.ComputeGeodesicBuffer = function(baseGeometry, distance)
	{
		return TF.GIS.SDK.geometryEngine.geodesicBuffer(baseGeometry, distance, "meters");
	}

	//#endregion

})();