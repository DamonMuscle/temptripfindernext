(function()
{
	createNamespace("TF.GIS").GeometryEnum =
	{
		GEOMETRY_TYPE: {
			POINT: "point",
			POLYLINE: "polyline",
			POLYGON: "polygon"
		},
		WKID: {
			WGS_1984: 4326,
			WEB_MERCATOR: 102100
		}
	};
})();