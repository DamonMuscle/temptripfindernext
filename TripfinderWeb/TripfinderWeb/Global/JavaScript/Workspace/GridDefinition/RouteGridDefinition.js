(function()
{
	createNamespace("TF.GridDefinition").RouteGridDefinition = RouteGridDefinition;
	function RouteGridDefinition()
	{
	}

	RouteGridDefinition.prototype.gridDefinition = function()
	{
		return {
			Columns: [
				{
					FieldName: "Name",
					DisplayName: "Name",
					DBName: "Name",
					Width: '370px',
					type: "string",
					ListFilterTemplate: TF.ListFilterDefinition.ListFilterTemplate.Route
				},
				{
					FieldName: "Notes",
					DisplayName: "Notes",
					DBName: "Notes",
					Width: '150px',
					type: "string",
				},
				{
					FieldName: "LastUpdatedBy",
					DisplayName: "Last Updated By",
					Width: '150px',
					type: "string"
				},
				{
					FieldName: "LastUpdatedOn",
					DisplayName: "Last Updated Date",
					Width: '160px',
					type: "date"
				},
				{
					FieldName: "HasTrip",
					DBName: "HasTrip",
					type: "boolean",
					hidden: true,
					onlyForFilter: true
				},
				{
					FieldName: "Id",
					DBName: "RouteId",
					Width: '150px',
					type: "integer",
					hidden: true,
					onlyForFilter: true
				}
			].concat(tf.UDFDefinition.getAvailableWithCurrentDataSource("route")),
			InvisibleUDFColumns: tf.UDFDefinition.getInvisibleUDFs("route"),
			formatter: function(value)
			{
				if (!value)
				{
					return "";
				}
				var result = value.replace(/!/g, ", ").trim();
				return result.substr(result.length - 1, 1) === ',' ? result.substr(0, result.length - 1) : result;
			}
		}
	};

	tf.routeGridDefinition = new TF.GridDefinition.RouteGridDefinition();
})();
