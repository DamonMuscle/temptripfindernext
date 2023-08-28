(function()
{
	createNamespace("TF.GIS").StopHelper = StopHelper;

	function StopHelper() { }

	StopHelper.GetPointOnPolylineByDistanceToPoint = function(polyline, distance, fromStartToEnd)
	{
		const clonePolyline = polyline.clone();
		if (!fromStartToEnd)
		{
			clonePolyline.paths[0] = clonePolyline.paths[0].reverse();
		}

		if (TF.GIS.GeometryHelper.CalculatePolylineGeodesicLength(clonePolyline) <= distance)
		{
			const x = clonePolyline.paths[0][0][0], y = clonePolyline.paths[0][0][1];
			return TF.GIS.GeometryHelper.CreateWebMercatorPoint(x, y);
		}
		
		let totalSegmentLength = 0;
		for (let i = 0; i < clonePolyline.paths[0].length - 1; i++)
		{
			const paths = [[clonePolyline.paths[0][i], clonePolyline.paths[0][i + 1]]];
			const segment = TF.GIS.GeometryHelper.CreateWebMercatorPolyline(paths);
			const segmentLength = TF.GIS.GeometryHelper.CalculatePolylineGeodesicLength(segment);
			totalSegmentLength = totalSegmentLength + segmentLength;
			if (totalSegmentLength > distance)
			{
				const currentDifferenceLength = distance - (totalSegmentLength - segmentLength);
				return StopHelper._findPointOnLineByDistance(segment, currentDifferenceLength);
			}
		}
	};

	StopHelper._findPointOnLineByDistance = function(line, distance)
	{
		var fromPoint = TF.GIS.GeometryHelper.CreateWebMercatorPoint(line.paths[0][0][0], line.paths[0][0][1]);
		var toPoint = TF.GIS.GeometryHelper.CreateWebMercatorPoint(line.paths[0][1][0], line.paths[0][1][1]);
		var length = TF.GIS.GeometryHelper.CalculatePolylineGeodesicLength(line);
		var ratio = distance == 0 || length == 0 ? 0 : (distance / length);
		var point = TF.GIS.GeometryHelper.CreateWebMercatorPoint(
			(1 - ratio) * fromPoint.x + ratio * toPoint.x,
			(1 - ratio) * fromPoint.y + ratio * toPoint.y
		);
		return point;
	};
})();