(function()
{
	createNamespace("TF.GridDefinition").GeoregionGridDefinition = GeoregionGridDefinition;
	function GeoregionGridDefinition()
	{

	}

	GeoregionGridDefinition.prototype.gridDefinition = function()
	{
		return {
			Columns: [
				{
					FieldName: "Name",
					Width: '250px',
					type: "string",
					ListFilterTemplate: TF.ListFilterDefinition.ListFilterTemplate.GeoRegion
				},
				{
					FieldName: "Geo",
					DisplayName: "Geocoded",
					Width: '150px',
					TypeHint: "BoolToChar",
					type: "boolean",
					filterConvert: function(filter)
					{
						filter.Operator = TF.Grid.LightKendoGrid.prototype.operatorKendoMapTF['eq'];
						if (filter.Value === true || filter.Value === "true")
						{
							filter.Value = '4';
						}
						else if (filter.Value === false || filter.Value === "false")
						{
							filter.Operator = TF.Grid.LightKendoGrid.prototype.operatorKendoMapTF['neq'];
							filter.Value = '4';
						}
						else
						{
							filter.Value = '';
						}

						return filter;
					},
					template: function(item)
					{
						if (item.Geo)
							return "<div class='icon-inner icon-geocoded'></div>";
						else
							return "<div></div>";
					}
				},
				{
					FieldName: "HotLink",
					DisplayName: "Hotlink",
					Width: '640px',
					type: "string"
				},
				{
					FieldName: "Comments",
					DisplayName: "Notes",
					Width: '150px',
					type: "string"
				},
				{
					FieldName: "HasObject",
					DisplayName: "Boundary Created",
					Width: '130px',
					type: "boolean",
					template: "<input type='checkbox' #: tf.georegionGridDefinition.gridDefinition().booleanToCheckboxFormatter(HasObject == '33')# onclick='return false' disabled/>",
					filterConvert: function(filter)
					{
						filter.Operator = TF.Grid.LightKendoGrid.prototype.operatorKendoMapTF['eq'];
						if (filter.Value === true || filter.Value === "true")
						{
							filter.Value = '33';
						}
						else if (filter.Value === false || filter.Value === "false")
						{
							filter.Operator = TF.Grid.LightKendoGrid.prototype.operatorKendoMapTF['neq'];
							filter.Value = '33';
						}
						else
						{
							filter.Value = '';
						}

						return filter;
					}
				},
				{
					FieldName: "Georegiontype",
					DisplayName: "Geo Region Type",
					Width: '140px',
					type: "string",
					ListFilterTemplate: TF.ListFilterDefinition.ListFilterTemplate.GeneralDataListsGeoRegionType // TF.ListFilterDefinition.ListFilterTemplate.DistinctListValue("GeneralDataListsGeoRegionType","georegion","Georegiontype")
				},
				{
					FieldName: "GeoCity",
					DisplayName: "Geo City",
					DBName: "Geo_City",
					Width: '150px',
					type: "string",
					ListFilterTemplate: TF.ListFilterDefinition.ListFilterTemplate.DistinctListValue("GeoCity2", "georegion", "GeoCity")
				},
				{
					FieldName: "GeoCounty",
					DisplayName: "Map Set",
					DBName: "Geo_County",
					Width: '150px',
					type: "string",
					ListFilterTemplate: TF.ListFilterDefinition.ListFilterTemplate.DistinctListValue("Mapset2", "georegion", "GeoCounty")
				},
				{
					FieldName: "GeoStreet",
					DisplayName: "Geo Street",
					DBName: "Geo_Street",
					Width: '190px',
					type: "string"
				},
				{
					FieldName: "GeoZip",
					DisplayName: "Geo " + tf.localization.Postal,
					DBName: "geo_zip",
					Width: '150px',
					type: "string",
					ListFilterTemplate: TF.ListFilterDefinition.ListFilterTemplate.DistinctListValue("GeoZipCode", "georegion", "GeoZip")
				},
				{
					FieldName: "GeoConfidence",
					DisplayName: "Geo Confidence",
					Width: '150px',
					type: "string",
					hidden: true
				},
				{
					FieldName: "MailCity",
					DisplayName: "Mail City",
					DBName: "Mail_City",
					Width: '150px',
					type: "string",
					hidden: true,
					ListFilterTemplate: TF.ListFilterDefinition.ListFilterTemplate.DistinctListValue("GeneralDataListsMailingCity", "georegion", "MailCity")
				},
				{
					FieldName: "MailState",
					DisplayName: "Mail " + tf.localization.AreaName,
					DBName: "Mail_State",
					Width: '150px',
					type: "string",
					hidden: true
				},
				{
					FieldName: "MailStreet1",
					DisplayName: "Mail Street #1",
					DBName: "Mail_Street1",
					Width: '190px',
					type: "string",
					hidden: true
				},
				{
					FieldName: "MailStreet2",
					DisplayName: "Mail Street #2",
					DBName: "Mail_Street2",
					Width: '190px',
					type: "string",
					hidden: true
				},
				{
					FieldName: "MailZip",
					DisplayName: "Mail " + tf.localization.Postal,
					DBName: "Mail_Zip",
					Width: '150px',
					type: "string",
					hidden: true,
					ListFilterTemplate: TF.ListFilterDefinition.ListFilterTemplate.DistinctListValue("GeneralDataListsMailingZipCode", "georegion", "MailZip")
				},
				{
					FieldName: "Xcoord",
					DisplayName: "X Coord",
					Width: '150px',
					type: "number",
					Precision: 6,
					format: "{0:0.000000}",
					hidden: true
				},
				{
					FieldName: "Ycoord",
					DisplayName: "Y Coord",
					Width: '150px',
					type: "number",
					Precision: 6,
					format: "{0:0.000000}",
					hidden: true
				},
				{
					FieldName: "Id",
					DBName: "GeoRegionId",
					Width: '150px',
					type: "integer",
					hidden: true,
					onlyForFilter: true
				},
				{
					FieldName: "GeoRegionTypeId",
					Width: '150px',
					type: "integer",
					hidden: true,
					onlyForFilter: true
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
					FieldName: "LastUpdatedName",
					DisplayName: "Last Updated By",
					Width: '150px',
					type: "string",
					hidden: true
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
					FieldName: "LastUpdatedType",
					DisplayName: "Last Updated Type",
					Width: '150px',
					type: "integer",
					hidden: true,
					onlyForFilter: true
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
			].concat(tf.UDFDefinition.getAvailableWithCurrentDataSource("georegion")),
			InvisibleUDFColumns: tf.UDFDefinition.getInvisibleUDFs("georegion"),
			booleanToCheckboxFormatter: function(value)
			{
				var checked = "";
				if (value && value !== "false")
				{
					checked = "checked";
				}
				return checked;
			},
			getIconUrl: function(value)
			{
				if (value == "5")
				{
					return 'grid-icon grid-icon-editor_pencil';
				}
				return "";
			}
		}
	};

	tf.georegionGridDefinition = new TF.GridDefinition.GeoregionGridDefinition();
})();
