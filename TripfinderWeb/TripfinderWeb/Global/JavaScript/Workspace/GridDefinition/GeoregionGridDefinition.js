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
					FieldName: "ContactName",
					DisplayName: "Contact Name",
					Width: '150px',
					type: "string"
				},
				{
					FieldName: "ContactPhone",
					DisplayName: "Contact Phone",
					Width: '150px',
					type: "string"
				},
				{
					FieldName: "ContactPhoneExt",
					DisplayName: "Contact Phone Ext.",
					Width: '130px',
					type: "string"
				},
				{
					FieldName: "ContactEmail",
					DisplayName: "Contact Email",
					Width: '170px',
					type: "string"
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
							filter.Value =  '';
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
					template: "<input type='checkbox' #: tf.georegionGridDefinition.gridDefinition().booleanToCheckboxFormatter(HasObject)# onclick='return false' disabled/>"
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
					ListFilterTemplate: TF.ListFilterDefinition.ListFilterTemplate.DistinctListValue("GeoCity2","georegion","GeoCity")
				},
				{
					FieldName: "GeoCounty",
					DisplayName: "Map Set",
					DBName: "Geo_County",
					Width: '150px',
					type: "string",
					ListFilterTemplate: TF.ListFilterDefinition.ListFilterTemplate.DistinctListValue("Mapset2","georegion","GeoCounty")
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
					ListFilterTemplate: TF.ListFilterDefinition.ListFilterTemplate.DistinctListValue("GeoZipCode","georegion","GeoZip")
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
					ListFilterTemplate: TF.ListFilterDefinition.ListFilterTemplate.DistinctListValue("GeneralDataListsMailingCity","georegion","MailCity")
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
					ListFilterTemplate: TF.ListFilterDefinition.ListFilterTemplate.DistinctListValue("GeneralDataListsMailingZipCode","georegion","MailZip")
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
					FieldName: "UserChar1",
					DisplayName: "User_Char1",
					DBName: "user_char1",
					Width: '150px',
					type: "string",
					hidden: true
				},
				{
					FieldName: "UserChar2",
					DisplayName: "User_Char2",
					DBName: "user_char2",
					Width: '150px',
					type: "string",
					hidden: true
				},
				{
					FieldName: "UserChar3",
					DisplayName: "User_Char3",
					DBName: "user_char3",
					Width: '150px',
					type: "string",
					hidden: true
				},
				{
					FieldName: "UserChar4",
					DisplayName: "User_Char4",
					DBName: "user_char4",
					Width: '150px',
					type: "string",
					hidden: true
				},
				{
					FieldName: "UserNum1",
					DisplayName: "User_Num1",
					DBName: "user_num1",
					Width: '150px',
					type: "number",
					hidden: true
				},
				{
					FieldName: "UserNum2",
					DisplayName: "User_Num2",
					DBName: "user_num2",
					Width: '150px',
					type: "number",
					hidden: true
				},
				{
					FieldName: "UserNum3",
					DisplayName: "User_Num3",
					DBName: "user_num3",
					Width: '150px',
					type: "number",
					hidden: true
				},
				{
					FieldName: "UserNum4",
					DisplayName: "User_Num4",
					DBName: "user_num4",
					Width: '150px',
					type: "number",
					hidden: true
				},
				{
					FieldName: "UserDate1",
					DisplayName: "User_Date1",
					DBName: "user_date1",
					Width: '150px',
					type: "date",
					hidden: true
				},
				{
					FieldName: "UserDate2",
					DisplayName: "User_Date2",
					DBName: "user_date2",
					Width: '150px',
					type: "date",
					hidden: true
				},
				{
					FieldName: "UserDate3",
					DisplayName: "User_Date3",
					DBName: "user_date3",
					Width: '150px',
					type: "date",
					hidden: true
				},
				{
					FieldName: "UserDate4",
					DisplayName: "User_Date4",
					DBName: "user_date4",
					Width: '150px',
					type: "date",
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
					type: "date",
					hidden: true
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
			],
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
