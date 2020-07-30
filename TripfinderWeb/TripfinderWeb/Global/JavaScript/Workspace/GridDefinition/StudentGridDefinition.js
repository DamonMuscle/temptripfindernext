(function()
{
	createNamespace("TF.GridDefinition").StudentGridDefinition = StudentGridDefinition;
	function StudentGridDefinition()
	{

	}

	StudentGridDefinition.prototype.gridDefinition = function()
	{
		let definition = {
			Columns: [
				{
					FieldName: "LocalId",
					DisplayName: "Local ID",
					DBName: "local_id",
					Width: '150px',
					type: "string"
				},
				{
					FieldName: "LastName",
					DisplayName: "Last Name",
					DBName: "last_name",
					Width: '150px',
					type: "string"
				},
				{
					FieldName: "FirstName",
					DisplayName: "First Name",
					DBName: "first_name",
					Width: '150px',
					type: "string"
				},
				{
					FieldName: "SchoolName",
					DisplayName: "School of Attendance Name",
					DBName: "SchoolName",
					Width: '150px',
					type: "string",
					ListFilterTemplate: TF.ListFilterDefinition.ListFilterTemplate.School
				},
				{
					FieldName: "School",
					DisplayName: "School of Attendance Code",
					DBName: "School",
					Width: '150px',
					type: "string"
				},
				{
					FieldName: "LoadTime",
					DisplayName: "Load Time",
					DBName: "LoadTime",
					Width: '100px',
					type: "integer"
				},
				{
					FieldName: "MailStreet1",
					DisplayName: "Mail Street #1",
					DBName: "mail_Street1",
					Width: '150px',
					type: "string"
				},
				{
					FieldName: "MailCity",
					DisplayName: "Mail City",
					DBName: "mail_City",
					Width: '150px',
					type: "string",
					ListFilterTemplate: TF.ListFilterDefinition.ListFilterTemplate.DistinctListValue("GeneralDataListsMailingCity", "student", "MailCity")
				},
				{
					FieldName: "MailState",
					DisplayName: "Mail " + tf.localization.AreaName,
					DBName: "mail_State",
					Width: '150px',
					type: "string"
				},
				{
					FieldName: "MailZip",
					DisplayName: "Mail " + tf.localization.Postal,
					DBName: "mail_zip",
					Width: '150px',
					type: "string",
					ListFilterTemplate: TF.ListFilterDefinition.ListFilterTemplate.DistinctListValue("GeneralDataListsMailingZipCode", "student", "MailZip")
				},
				{
					FieldName: "ActualLoadTime",
					DisplayName: "Actual Load Time",
					Width: '150px',
					type: "number",
					hidden: true
				},
				{
					FieldName: "Age",
					Width: '150px',
					type: "integer",
					hidden: true
				},
				{
					FieldName: "AideReq",
					DisplayName: "Bus Aide Required",
					DBName: "aide_req",
					Width: '150px',
					type: "boolean",
					hidden: true
				},
				{
					FieldName: "TagId",
					DisplayName: "Card ID",
					Width: '150px',
					type: "string",
					hidden: true
				},
				{
					FieldName: "Cohort",
					DisplayName: "Cohort",
					Width: '150px',
					type: "string",
					hidden: true
				},
				{
					FieldName: "Dob",
					DisplayName: "Date of Birth",
					Width: '150px',
					type: "date",
					hidden: true
				},
				{
					FieldName: "Disabled",
					DisplayName: "Disabled",
					Width: '150px',
					type: "boolean",
					hidden: true
				},
				{
					FieldName: "Mifromschl",
					DisplayName: "Distance From School of Attendance",
					Width: '150px',
					type: "number",
					hidden: true
				},
				{
					FieldName: "MifromResidSch",
					DisplayName: "Distance From School of Residence",
					Width: '150px',
					type: "number",
					hidden: true
				},
				{
					FieldName: "District",
					DisplayName: "District",
					Width: '150px',
					type: "string",
					hidden: true,
					ListFilterTemplate: TF.ListFilterDefinition.ListFilterTemplate.District.District2
				},
				{
					FieldName: "AidEligible",
					DisplayName: "Eligible for Aid",
					DBName: "aid_eligible",
					Width: '150px',
					type: "boolean",
					hidden: true
				},
				{
					FieldName: "Transported",
					DisplayName: "Eligible for Transport",
					Width: '150px',
					type: "boolean",
					hidden: true
				},
				{
					FieldName: "EntryDate",
					DisplayName: "Entry Date",
					DBName: "entry_date",
					Width: '150px',
					type: "datetime",
					hidden: true
				},
				{
					FieldName: "CalculatedLoadTime",
					DisplayName: "Estimated Load Time",
					Width: '150px',
					type: "integer",
					hidden: true
				},
				{
					FieldName: "EthnicCode",
					DisplayName: "Ethnic Code",
					Width: '150px',
					type: "string",
					hidden: true,
					ListFilterTemplate: TF.ListFilterDefinition.ListFilterTemplate.GeneralDataListsEthnicCode
				},
				{
					FieldName: "Sex",
					DisplayName: "Gender",
					Width: '150px',
					type: "string",
					hidden: true,
					ListFilterTemplate: TF.ListFilterDefinition.ListFilterTemplate.Gender
				},
				{
					FieldName: "GeoCity",
					DisplayName: "Geo City",
					DBName: "geo_city",
					Width: '150px',
					type: "string",
					hidden: true,
					ListFilterTemplate: TF.ListFilterDefinition.ListFilterTemplate.DistinctListValue("GeoCity2", "student", "GeoCity")
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
					DBName: "geo_street",
					Width: '150px',
					type: "string",
					hidden: true
				},
				{
					FieldName: "GeoStreetName",
					DisplayName: "Geo Street Name",
					Width: '150px',
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
					ListFilterTemplate: TF.ListFilterDefinition.ListFilterTemplate.DistinctListValue("GeoZipCode", "student", "GeoZip")
				},
				{
					FieldName: "Geo",
					DisplayName: "Geocoded",
					Width: '150px',
					type: "boolean",
					hidden: true,
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
					FieldName: "Grade",
					DisplayName: "Grade",
					Width: '150px',
					type: "string",
					hidden: true,
					ListFilterTemplate: TF.ListFilterDefinition.ListFilterTemplate.Grades
				},
				{
					FieldName: "Guid",
					DisplayName: "GUID",
					Width: '150px',
					type: "string",
					hidden: true
				},
				{
					FieldName: "InActive",
					DisplayName: "Inactive",
					Width: '150px',
					type: "boolean",
					hidden: true
				},
				{
					FieldName: "IntegrationAction",
					DisplayName: "Integration Action",
					Width: '150px',
					type: "string",
					hidden: true
				},
				{
					FieldName: "IntGratDate1",
					DisplayName: "Integration Date",
					Width: '150px',
					type: "date",
					hidden: true
				},
				{
					FieldName: "IntegrationUnGeoCode",
					DisplayName: "Integration UnGeocoded",
					Width: '150px',
					type: "string",
					hidden: true
				},
				{
					FieldName: "IntegrationUnRoute",
					DisplayName: "Integration Unrouted",
					Width: '150px',
					type: "string",
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
					FieldName: "LastUpdated",
					DisplayName: "Last Updated Date",
					Width: '150px',
					type: "date",
					hidden: true
				},
				{
					FieldName: "LoadTimeManuallyChanged",
					DisplayName: "Load Time Adjusted",
					Width: '150px',
					type: "boolean",
					hidden: true
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
					DBName: "mail_Street2",
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
					DBName: "geo_county",
					Width: '150px',
					type: "string",
					hidden: true,
					ListFilterTemplate: TF.ListFilterDefinition.ListFilterTemplate.DistinctListValue("Mapset", "student", "GeoCounty")
				},
				{
					FieldName: "Mi",
					DisplayName: "Middle Initial",
					Width: '150px',
					type: "string",
					hidden: true
				},
				{
					FieldName: "FullName",
					DisplayName: "Name",
					Width: '150px',
					type: "string",
					hidden: true
				},
				{
					FieldName: "Comments",
					DisplayName: "Notes",
					Width: '150px',
					type: "string",
					hidden: true
				},
				{
					FieldName: "PreRedistSchool",
					DisplayName: "PreRedistricting School of Attendance",
					Width: '260px',
					type: "string",
					hidden: true,
					ListFilterTemplate: TF.ListFilterDefinition.ListFilterTemplate.School
				},
				{
					FieldName: "Priorschool",
					DisplayName: "Prior School of Attendance",
					Width: '190px',
					type: "string",
					hidden: true,
					ListFilterTemplate: TF.ListFilterDefinition.ListFilterTemplate.School
				},
				{
					FieldName: "RideTimePolicy",
					DisplayName: "Ride Time Policy",
					Width: '150px',
					type: "string",
					hidden: true
				},
				// {
				// 	FieldName: "School",
				// 	DisplayName: "School of Attendance Code",
				// 	Width: '150px',
				// 	type: "string",
				// 	hidden: true,
				// 	attributes: {
				// 		"onclick": "tf.studentGridDefinition.gridDefinition().openSchool('#:School#')",
				// 		"class": "k-link"
				// 	},
				// 	ListFilterTemplate: TF.ListFilterDefinition.ListFilterTemplate.School.SchoolCode
				// },
				{
					FieldName: "ResidSchool",
					DisplayName: "School of Residence Code",
					Width: '150px',
					type: "string",
					hidden: true,
					ListFilterTemplate: TF.ListFilterDefinition.ListFilterTemplate.School.SchoolCode
				},
				{
					FieldName: "ResSchName",
					DisplayName: "School of Residence Name",
					Width: '150px',
					type: "string",
					hidden: true,
					ListFilterTemplate: TF.ListFilterDefinition.ListFilterTemplate.School
				},
				{
					FieldName: "WalkToSchoolPolicy",
					DisplayName: "Walk To School Policy",
					Width: '150px',
					type: "number",
					hidden: true
				},
				{
					FieldName: "WalkToStopPolicy",
					DisplayName: "Walk To Stop Policy",
					Width: '150px',
					type: "number",
					hidden: true
				},
				{
					FieldName: "Xcoord",
					DisplayName: "X Coord",
					Width: '150px',
					type: "number",
					hidden: true,
					Precision: 6,
					format: "{0:0.000000}"
				},
				{
					FieldName: "Ycoord",
					DisplayName: "Y Coord",
					Width: '150px',
					type: "number",
					hidden: true,
					Precision: 6,
					format: "{0:0.000000}"
				},
				{
					FieldName: "DOGUID",
					Width: '150px',
					type: "string",
					hidden: true,
					onlyForFilter: true
				},
				{
					FieldName: "DOTRANSGUID",
					Width: '150px',
					type: "string",
					hidden: true,
					onlyForFilter: true
				},
				{
					FieldName: "IntGratChar1",
					Width: '150px',
					type: "string",
					hidden: true,
					onlyForFilter: true
				},
				{
					FieldName: "IntGratChar2",
					Width: '150px',
					type: "string",
					hidden: true,
					onlyForFilter: true
				},
				{
					FieldName: "IntGratDate2",
					Width: '150px',
					type: "date",
					hidden: true,
					onlyForFilter: true
				},
				{
					FieldName: "IntGratNum1",
					Width: '150px',
					type: "number",
					hidden: true,
					onlyForFilter: true
				},
				{
					FieldName: "IntGratNum2",
					Width: '150px',
					type: "number",
					hidden: true,
					onlyForFilter: true
				},
				{
					FieldName: "LoadTime",
					Width: '150px',
					type: "integer",
					hidden: true,
					onlyForFilter: true
				},
				{
					FieldName: "PUGUID",
					Width: '150px',
					type: "string",
					hidden: true,
					onlyForFilter: true
				},
				{
					FieldName: "PUTRANSGUID",
					Width: '150px',
					type: "string",
					hidden: true,
					onlyForFilter: true
				},
				{
					FieldName: "Id",
					DBName: "stud_id",
					Width: '150px',
					type: "integer",
					hidden: true,
					onlyForFilter: true
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
			].concat(tf.UDFDefinition.getAvailableWithCurrentDataSource("student"))
				.concat(
					[...new Array(4).fill("").map((x, index) => ({
						FieldNamePrefix: `ToSchoolTrip${index + 1}`,
						DisplayNamePrefix: `To School Trip ${index + 1}`
					})),
					...new Array(4).fill("").map((x, index) => ({
						FieldNamePrefix: `FromSchoolTrip${index + 1}`,
						DisplayNamePrefix: `From School Trip ${index + 1}`
					}))
					].reduce((result, item) => result.concat(tf.helpers.kendoGridHelper.getGridColumnsFromDefinitionByType("studentschedule").map(i => ({
						...i,
						DisplayName: `${item.DisplayNamePrefix} ${i.DisplayName}`,
						FieldName: `${item.FieldNamePrefix}${i.FieldName}`,
						width: `${parseInt(i.width) + 100}px`
					}))), [])
				),
			InvisibleUDFColumns: tf.UDFDefinition.getInvisibleUDFs("student"),
			Sifchanged: function(value)
			{
				var checked = "";
				if (value)
				{
					checked = "checked";
				}
				return checked;
			},
			getIconUrl_Ampmschedule: function(value)
			{
				if (value == 14)
				{
					return 'grid-icon grid-icon-schoolshuttle';
				}
				if (value == 15)
				{
					return 'grid-icon grid-icon-schoolshuttle_front';
				}
				if (value == 16)
				{
					return 'grid-icon grid-icon-schoolshuttle_back';
				}
				return '';
			},
			getIconUrl_Ampmtransportation: function(value)
			{
				if (value === '12')
				{
					return 'grid-icon grid-icon-sunmoon';
				}
				if (value === '10')
				{
					return 'grid-icon grid-icon-sun';
				}
				if (value === '11')
				{
					return 'grid-icon grid-icon-moon';
				}
				return '';
			},
			getIconUrl_IsLocked: function(value)
			{
				if (value == "6")
				{
					return 'grid-icon grid-icon-lock';
				}
				return 'grid-icon grid-icon-unlock';
			},
			getIconUrl_Notes: function(value)
			{
				if (value == "5")
				{
					return 'grid-icon grid-icon-editor_pencil';
				}
				return '';
			},
			getIconUrl_PolicyDeviation: function(value)
			{
				if (value === '37')
				{
					return 'grid-icon grid-icon-reddot';
				}
				else
				{
					return '';
				}
			},
			openSchool: function(value)
			{
				alert("trying to open the school");
			},
			getImage: function(id, object)
			{
				return TF.Control.EditPhotoViewModel.prototype.getImage("student", id)
					.then(function(image)
					{
						object.src = 'data:image/jpeg;base64,' + image;
					}.bind(this));
			}
		}

		return definition;
	};

	tf.studentGridDefinition = new TF.GridDefinition.StudentGridDefinition();
})();
