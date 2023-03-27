(function()
{
	createNamespace("TF.GridDefinition").FormGridDefinition = FormGridDefinition;
	function FormGridDefinition()
	{
	}

	FormGridDefinition.prototype.gridDefinition = function(columns)
	{
		function utc2Local(value)
		{
			const dt = utcToClientTimeZone(value);
			return dt.isValid() ? dt.format("MM/DD/YYYY hh:mm A") : "";
		}

		return {
			Columns: [
				{
					FieldName: "Id",
					DBName: "Id",
					Width: '150px',
					type: "integer",
					hidden: true,
					onlyForFilter: true
				},
				{
					FieldName: "RecordID",
					type: "integer",
					hidden: true,
					onlyForFilter: true
				},
				{
					FieldName: "Name",
					Width: '150px',
					type: "string"
				},
				{
					FieldName: "Description",
					Width: '150px',
					type: "string"
				},
				{
					FieldName: "CreatedBy",
					DisplayName: "Created By",
					Width: '150px',
					type: "string"
				},
				{
					FieldName: "CreatedOn",
					DisplayName: "Created On",
					Width: '150px',
					type: "datetime",
					isUTC: true,
					template: function(item)
					{
						return utc2Local(item["CreatedOn"]);
					},
					formatSummaryValue: utc2Local,
					formatCopyValue: utc2Local,
				},
				{
					FieldName: "LastUpdatedBy",
					DisplayName: "Last Updated By",
					Width: '150px',
					type: "string"
				},
				{
					FieldName: "LastUpdatedOn",
					DisplayName: "Last Updated",
					Width: '150px',
					type: "datetime",
					isUTC: true,
					template: function(item)
					{
						return utc2Local(item["LastUpdatedOn"]);
					},
					formatSummaryValue: utc2Local,
					formatCopyValue: utc2Local,
				},
				{
					FieldName: "Longitude",
					DisplayName: "Location X Coord",
					Width: '150px',
					type: "number",
					Precision: 6,
					template: function(item)
					{
						let value = item["Longitude"];
						if (!value || value == 0) return "";
						return value.toFixed(6);
					},
					format: "{0:0.000000}"
				},
				{
					FieldName: "Latitude",
					DisplayName: "Location Y Coord",
					Width: '150px',
					type: "number",
					Precision: 6,
					template: function(item)
					{
						let value = item["Latitude"];
						if (!value || value == 0) return "";
						return value.toFixed(6);
					},
					format: "{0:0.000000}"
				},
				{
					FieldName: "IPAddress",
					DisplayName: "IP Address",
					Width: '100px',
					type: "string"
				},
				{
					FieldName: "Host",
					DisplayName: "Host",
					Width: '100px',
					type: "string"
				},
				{
					FieldName: "UserAgent",
					DisplayName: "User Agent",
					Width: '150px',
					type: "string"
				}
			].concat(columns || [])
		};
	};

	tf.formGridDefinition = new TF.GridDefinition.FormGridDefinition();
})();
