﻿(function()
{
	createNamespace("TF.GridDefinition").FieldTripLocationGridDefinition = FieldTripLocationGridDefinition;
	function FieldTripLocationGridDefinition()
	{

	}

	FieldTripLocationGridDefinition.prototype.gridDefinition = function () {
		var columns = [
			{
				FieldName: "Name",
				DisplayName: "Name",
				defaultValue: "",
				unique: true,
				type: "string",
				Width: '150px'
			},
			{
				FieldName: "City",
				DisplayName: "City",
				defaultValue: "",
				type: "string",
				Width: '120px'
			},
			{
				FieldName: "Street",
				DisplayName: "Street",
				defaultValue: "",
				type: "string",
				Width: '200px'
			},
			{
				FieldName: "State",
				DisplayName: "State",
				defaultValue: "",
				type: "string"
			},
			{
				FieldName: "Zip",
				DisplayName: "Zip",
				defaultValue: "",
				type: "string"
			},
			{
				FieldName: "GeoStreet",
				DisplayName: "Geo Street",
				DBName: "Geo_Street",
				Width: '190px',
				type: "string"
			},
			{
				FieldName: "GeoCity",
				DisplayName: "Geo City",
				DBName: "Geo_City",
				Width: '150px',
				type: "string",
				ListFilterTemplate: TF.ListFilterDefinition.ListFilterTemplate.DistinctListValue("GeoCity2", "fieldtriplocation", "GeoCity")
			},
			{
				FieldName: "GeoCounty",
				DisplayName: "Map Set",
				DBName: "Geo_County",
				Width: '150px',
				type: "string",
				ListFilterTemplate: TF.ListFilterDefinition.ListFilterTemplate.DistinctListValue("Mapset2", "fieldtriplocation", "GeoCounty")
			},
			{
				FieldName: "GeoZip",
				DisplayName: "Geo " + tf.localization.Postal,
				DBName: "geo_zip",
				Width: '150px',
				type: "string",
				ListFilterTemplate: TF.ListFilterDefinition.ListFilterTemplate.DistinctListValue("GeoZipCode", "fieldtriplocation", "GeoZip")
			},
			{
				FieldName: "Notes",
				DisplayName: "Notes",
				defaultValue: "",
				type: "string",
				Width: '200px'
			},
			{
				FieldName: "XCoord",
				DisplayName: "X Coord",
				Width: '150px',
				type: "number",
				Precision: 6,
				format: "{0:0.000000}"
			},
			{
				FieldName: "YCoord",
				DisplayName: "Y Coord",
				Width: '150px',
				type: "number",
				Precision: 6,
				format: "{0:0.000000}"
			},
			{
				FieldName: "GeocodeScore",
				DisplayName: "Geocode Score",
				Width: '150px',
				type: "number",
			},
			{
				FieldName: "LastUpdated",
				DisplayName: "Last Updated Date",
				Width: '150px',
				dbType: "datetime",
				type: "date",
				template: function(item)
				{
					let dt = utcToClientTimeZone(item["LastUpdated"]);
					return dt.isValid() ? dt.format("MM/DD/YYYY") : "";
				},
				isUTC: true
			},
			{
				FieldName: "LastUpdatedName",
				DisplayName: "Last Updated By",
				Width: '150px',
				type: "string",
			},
			{
				FieldName: "Geocoded",
				DisplayName: "Geocoded",
				Width: '150px',
				TypeHint: "BoolToChar",
				type: "boolean",
				filterConvert: function(filter)
				{
					filter.Operator = TF.Grid.LightKendoGrid.prototype.operatorKendoMapTF['eq'];
					if (filter.Value === true || filter.Value === "true")
					{
						filter.Value = '1';
					}
					else if (filter.Value === false || filter.Value === "false")
					{
						filter.Operator = TF.Grid.LightKendoGrid.prototype.operatorKendoMapTF['eq'];
						filter.Value = '0';
					}

					return filter;
				},
				template: function(item)
				{
					if (item.Geocoded == 'true')
						return "<div class='icon-inner icon-geocoded'></div>";
					else
						return "<div></div>";
				},
				formatCopyValue: function(value)
				{
					return value ? "True": "False";
				}
			},
		];

		return {
			Columns: columns.concat(tf.UDFDefinition.getAvailableWithCurrentDataSource("fieldtriplocation")),
			InvisibleUDFColumns: tf.UDFDefinition.getInvisibleUDFs("fieldtriplocation")
		};
	};

	tf.fieldtripLocationGridDefinition = new TF.GridDefinition.FieldTripLocationGridDefinition();
})();