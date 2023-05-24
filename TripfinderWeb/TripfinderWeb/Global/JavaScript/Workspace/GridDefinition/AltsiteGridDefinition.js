(function()
{
	createNamespace("TF.GridDefinition").AltsiteGridDefinition = AltsiteGridDefinition;
	function AltsiteGridDefinition()
	{

	}

	AltsiteGridDefinition.prototype.gridDefinition = function()
	{
		return {
			Columns: [
				{
					FieldName: "Id",
					DBName: "AltSiteID",
					Width: '260px',
					type: "integer",
					hidden: true,
					onlyForFilter: true
				},
				{
					FieldName: "Name",
					Width: '260px',
					type: "string",
					ListFilterTemplate: TF.ListFilterDefinition.ListFilterTemplate.AlternateSite
				},
				{
					FieldName: "Public",
					Width: '150px',
					type: "boolean"
				},
				{
					FieldName: "Phone",
					DisplayName: "Phone",
					type: "string",
					Width: '300px',
					template: function(item)
					{
						return tf.dataFormatHelper.phoneFormatter(item.Phone) || '';
					}
				},
				{
					FieldName: "Phone_Ext",
					DisplayName: "Ext",
					type: "string",
					Width: '300px'
				},
				{
					FieldName: "MailStreet1",
					DisplayName: "Mail Street #1",
					DBName: "Mail_Street1",
					Width: '230px',
					type: "string"
				},
				{
					FieldName: "MailCity",
					DisplayName: "Mail City",
					DBName: "Mail_City",
					Width: '150px',
					type: "string",
					ListFilterTemplate: TF.ListFilterDefinition.ListFilterTemplate.DistinctListValue("GeneralDataListsMailingCity", "altsite", "MailCity")
				},
				{
					FieldName: "MailState",
					DisplayName: "Mail " + tf.localization.AreaName,
					DBName: "Mail_State",
					Width: '150px',
					type: "string"
				},
				{
					FieldName: "MailZip",
					DisplayName: "Mail " + tf.localization.Postal,
					DBName: "Mail_Zip",
					Width: '150px',
					type: "string",
					ListFilterTemplate: TF.ListFilterDefinition.ListFilterTemplate.DistinctListValue("GeneralDataListsMailingZipCode", "altsite", "MailZip")
				},
				{
					FieldName: "Xcoord",
					DisplayName: "X Coord",
					Width: '150px',
					type: "number",
					Precision: 6,
					format: "{0:0.000000}"
				},
				{
					FieldName: "Ycoord",
					DisplayName: "Y Coord",
					Width: '150px',
					type: "number",
					Precision: 6,
					format: "{0:0.000000}"
				},
				{
					FieldName: "GeoCity",
					DisplayName: "Geo City",
					DBName: "Geo_City",
					Width: '150px',
					type: "string",
					hidden: true,
					ListFilterTemplate: TF.ListFilterDefinition.ListFilterTemplate.DistinctListValue("GeoCity2", "altsite", "GeoCity")
				},
				{
					FieldName: "GeoConfidence",
					DisplayName: "Geo Confidence",
					Width: '150px',
					type: "integer",
					hidden: true
				},
				{
					FieldName: "GeoStreetNumber",
					DisplayName: "Geo House #",
					Width: '150px',
					type: "string",
					hidden: true
				},
				{
					FieldName: "GeoStreet",
					DisplayName: "Geo Street",
					DBName: "Geo_Street",
					Width: '230px',
					type: "string",
					hidden: true
				},
				{
					FieldName: "GeoStreetName",
					DisplayName: "Geo Street Name",
					Width: '190px',
					type: "string",
					hidden: true
				},
				{
					FieldName: "GeoZip",
					DisplayName: "Geo " + tf.localization.Postal,
					DBName: "geo_zip",
					Width: '150px',
					type: "string",
					hidden: true,
					ListFilterTemplate: TF.ListFilterDefinition.ListFilterTemplate.DistinctListValue("GeoZipCode", "altsite", "GeoZip")
				},
				{
					FieldName: "LastUpdated",
					DisplayName: "Last Updated Date",
					Width: '150px',
					dbType: "datetime",
					type: "date",
					hidden: true,
					template: function(item)
					{
						let dt = utcToClientTimeZone(item["LastUpdated"]);
						return dt.isValid() ? dt.format("MM/DD/YYYY") : "";
					},
					isUTC: true
				},
				{
					FieldName: "LastUpdatedId",
					DisplayName: "Last Updated Id",
					Width: '150px',
					type: "integer",
					hidden: true,
					onlyForFilter: true
				},
				{
					FieldName: "LastUpdatedName",
					DisplayName: "Last Updated By",
					Width: '150px',
					type: "string",
					hidden: true
				},
				{
					FieldName: "LastUpdatedType",
					DisplayName: "Last Updated Type",
					Width: '150px',
					type: "integer",
					hidden: true,
					onlyForFilter: true
				},
				{
					FieldName: "MailStreetNumber",
					DisplayName: "Mail House #",
					Width: '150px',
					type: "string",
					hidden: true
				},
				{
					FieldName: "MailStreet2",
					DisplayName: "Mail Street #2",
					DBName: "Mail_Street2",
					Width: '150px',
					type: "string",
					hidden: true
				},
				{
					FieldName: "MailStreetName",
					DisplayName: "Mail Street Name",
					Width: '150px',
					type: "string",
					hidden: true
				},
				{
					FieldName: "GeoCounty",
					DisplayName: "Map Set",
					Width: '150px',
					type: "string",
					hidden: true,
					ListFilterTemplate: TF.ListFilterDefinition.ListFilterTemplate.DistinctListValue("Mapset2", "altsite", "GeoCounty")
				},
				{
					FieldName: "Comments",
					DisplayName: "Notes",
					Width: '150px',
					type: "string",
					hidden: true
				},
				{
					FieldName: "System1",
					Width: '150px',
					type: "string",
					hidden: true,
					onlyForFilter: true
				},
				{
					FieldName: "System2",
					Width: '150px',
					type: "string",
					hidden: true,
					onlyForFilter: true
				},
				{
					FieldName: "System3",
					Width: '150px',
					type: "string",
					hidden: true,
					onlyForFilter: true
				},
				{
					FieldName: "System4",
					Width: '150px',
					type: "string",
					hidden: true,
					onlyForFilter: true
				}
			].concat(tf.UDFDefinition.getAvailableWithCurrentDataSource("altsite")),
			InvisibleUDFColumns: tf.UDFDefinition.getInvisibleUDFs("altsite")
		};
	};

	tf.altsiteGridDefinition = new TF.GridDefinition.AltsiteGridDefinition();
})();
