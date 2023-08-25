(function()
{
	createNamespace("TF.GIS").StopHelper = StopHelper;

	function StopHelper() { }

	StopHelper.GetPointOnPolylineByDistanceToPoint = function(polyline, distance, fromStartToEnd)
	{
		var segmentLength = 0,
			currentDifferenceLength = 0;
		polyline = polyline.clone();
		if (!fromStartToEnd) { polyline.paths[0] = polyline.paths[0].reverse(); }
		if (TF.GIS.SDK.geometryEngine.geodesicLength(polyline, "meters") <= distance)
		{
			const x = polyline.paths[0][0][0], y = polyline.paths[0][0][1];
			return TF.GIS.GeometryHelper.CreateWebMercatorPoint(x, y);
		}
		for (var i = 0; i < polyline.paths[0].length - 1; i++)
		{
			var segment = new TF.GIS.SDK.Polyline({
				type: "polyline",
				spatialReference: { wkid: 102100 },
				paths: [[polyline.paths[0][i], polyline.paths[0][i + 1]]]
			});
			// segment.addPath([polyline.paths[0][i], polyline.paths[0][i + 1]]);
			segmentLength = segmentLength + TF.GIS.SDK.geometryEngine.geodesicLength(segment, "meters");
			if (segmentLength > distance)
			{
				currentDifferenceLength = distance - (segmentLength - TF.GIS.SDK.geometryEngine.geodesicLength(segment, "meters"));
				return StopHelper._findPointOnLineByDistance(segment, currentDifferenceLength);
			}
		}
	};

	StopHelper._findPointOnLineByDistance = function(line, distance)
	{
		var fromPoint = TF.GIS.GeometryHelper.CreateWebMercatorPoint(line.paths[0][0][0], line.paths[0][0][1]);
		var toPoint = TF.GIS.GeometryHelper.CreateWebMercatorPoint(line.paths[0][1][0], line.paths[0][1][1]);
		var length = TF.GIS.SDK.geometryEngine.geodesicLength(line, "meters");
		var ratio = distance == 0 || length == 0 ? 0 : (distance / length);
		var point = TF.GIS.GeometryHelper.CreateWebMercatorPoint(
			(1 - ratio) * fromPoint.x + ratio * toPoint.x,
			(1 - ratio) * fromPoint.y + ratio * toPoint.y
		);
		return point;
	};
})();