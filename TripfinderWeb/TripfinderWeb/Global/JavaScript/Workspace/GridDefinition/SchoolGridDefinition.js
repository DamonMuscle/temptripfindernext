(function()
{
	createNamespace("TF.GridDefinition").SchoolGridDefinition = SchoolGridDefinition;
	function SchoolGridDefinition()
	{
	}

	SchoolGridDefinition.prototype.gridDefinition = function()
	{
		return {
			Columns: [
				{
					FieldName: "School",
					DisplayName: "School Code",
					Width: '150px',
					type: "string",
					ListFilterTemplate: TF.ListFilterDefinition.ListFilterTemplate.School.SchoolCode
				},
				{
					FieldName: "Name",
					Width: '290px',
					type: "string"
				},
				{
					FieldName: "ArrivalTime",
					DisplayName: "Arrival Time",
					Width: '150px',
					type: "time"
				},
				{
					FieldName: "DepartTime",
					DisplayName: "Departure Time",
					Width: '150px',
					type: "time"
				},
				{
					FieldName: "DocumentCount",
					DisplayName: "# Documents",
					Width: '150px',
					type: "integer"
				},
				{
					FieldName: "MailStreet1",
					DisplayName: "Mail Street #1",
					DBName: "Mail_Street1",
					Width: '160px',
					type: "string"
				},
				{
					FieldName: "MailCity",
					DisplayName: "Mail City",
					DBName: "Mail_City",
					Width: '150px',
					type: "string",
					ListFilterTemplate: TF.ListFilterDefinition.ListFilterTemplate.DistinctListValue("GeneralDataListsMailingCity", "school", "MailCity")
				},
				{
					FieldName: "MailState",
					DisplayName: "Mail " + tf.localization.AreaName,
					DBName: "Mail_State",
					Width: '150px',
					type: "string",
					ListFilterTemplate: TF.ListFilterDefinition.ListFilterTemplate.DistinctListValue("GeneralDataListsMailingState", "school", "MailState")
				},
				{
					FieldName: "MailZip",
					DisplayName: "Mail " + tf.localization.Postal,
					DBName: "Mail_Zip",
					Width: '150px',
					type: "string",
					ListFilterTemplate: TF.ListFilterDefinition.ListFilterTemplate.DistinctListValue("GeneralDataListsMailingZipCode", "school", "MailZip")
				},
				{
					FieldName: "StudentCount",
					DisplayName: "Student Count",
					Width: '150px',
					type: "integer"
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
					FieldName: "Tschl",
					DisplayName: "Allows Transfers",
					Width: '150px',
					type: "boolean",
					hidden: true
				},
				{
					FieldName: "BeginTime",
					DisplayName: "Begin Time",
					DBName: "Begin_time",
					Width: '150px',
					type: "time",
					hidden: true
				},
				{
					FieldName: "District",
					Width: '150px',
					type: "string",
					hidden: true,
					ListFilterTemplate: TF.ListFilterDefinition.ListFilterTemplate.District.District2 //TF.ListFilterDefinition.ListFilterTemplate.DistinctListValue("District","school","District")
				},
				{
					FieldName: "EndTime",
					DisplayName: "End Time",
					DBName: "End_time",
					Width: '150px',
					type: "time",
					hidden: true
				},
				{
					FieldName: "FeedSchl",
					DisplayName: "Feed School",
					DBName: "Feed_Schl",
					Width: '150px',
					type: "string",
					hidden: true,
					ListFilterTemplate: TF.ListFilterDefinition.ListFilterTemplate.School.SchoolCode
				},
				{
					FieldName: "GeoCity",
					DisplayName: "Geo City",
					DBName: "Geo_City",
					Width: '150px',
					type: "string",
					hidden: true,
					ListFilterTemplate: TF.ListFilterDefinition.ListFilterTemplate.DistinctListValue("GeoCity2", "school", "GeoCity")
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
					Width: '150px',
					type: "string",
					hidden: true
				},
				{
					FieldName: "GeoStreetName",
					DisplayName: "Geo Street Name",
					Width: '130px',
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
					ListFilterTemplate: TF.ListFilterDefinition.ListFilterTemplate.DistinctListValue("GeoZipCode", "school", "GeoZip")
				},
				{
					FieldName: "Grade1",
					DisplayName: "Grade 1",
					Width: '150px',
					type: "integer",
					hidden: true
				},
				{
					FieldName: "Grade2",
					DisplayName: "Grade 2",
					Width: '150px',
					type: "integer",
					hidden: true
				},
				{
					FieldName: "Grade3",
					DisplayName: "Grade 3",
					Width: '150px',
					type: "integer",
					hidden: true
				},
				{
					FieldName: "Grade4",
					DisplayName: "Grade 4",
					Width: '150px',
					type: "integer",
					hidden: true
				},
				{
					FieldName: "Grade5",
					DisplayName: "Grade 5",
					Width: '150px',
					type: "integer",
					hidden: true
				},
				{
					FieldName: "Grade6",
					DisplayName: "Grade 6",
					Width: '150px',
					type: "integer",
					hidden: true
				},
				{
					FieldName: "Grade7",
					DisplayName: "Grade 7",
					Width: '150px',
					type: "integer",
					hidden: true
				},
				{
					FieldName: "Grade8",
					DisplayName: "Grade 8",
					Width: '150px',
					type: "integer",
					hidden: true
				},
				{
					FieldName: "Grade9",
					DisplayName: "Grade 9",
					Width: '150px',
					type: "integer",
					hidden: true
				},
				{
					FieldName: "Grade10",
					DisplayName: "Grade 10",
					Width: '150px',
					type: "integer",
					hidden: true
				},
				{
					FieldName: "Grade11",
					DisplayName: "Grade 11",
					Width: '150px',
					type: "integer",
					hidden: true
				},
				{
					FieldName: "Grade12",
					DisplayName: "Grade 12",
					Width: '150px',
					type: "integer",
					hidden: true
				},
				{
					FieldName: "GradeK",
					DisplayName: "Grade K",
					Width: '150px',
					type: "integer",
					hidden: true
				},
				{
					FieldName: "GradeKa",
					DisplayName: "Grade KA",
					Width: '150px',
					type: "integer",
					hidden: true
				},
				{
					FieldName: "GradeKp",
					DisplayName: "Grade KP",
					Width: '150px',
					type: "integer",
					hidden: true
				},
				{
					FieldName: "GradeP",
					DisplayName: "Grade P",
					Width: '150px',
					type: "integer",
					hidden: true
				},
				{
					FieldName: "GradePa",
					DisplayName: "Grade PA",
					Width: '150px',
					type: "integer",
					hidden: true
				},
				{
					FieldName: "GradePp",
					DisplayName: "Grade PP",
					Width: '150px',
					type: "integer",
					hidden: true
				},
				{
					FieldName: "GradeRange",
					DisplayName: "Grade Range",
					DBName: "grade_range",
					Width: '160px',
					type: "string",
					hidden: true
				},
				{
					FieldName: "Guid",
					DisplayName: "GUID",
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
					Width: '160px',
					dbType: "datetime",
					type: "date",
					hidden: true,
					template: function(item)
					{
						let dt = utcToClientTimeZone(item["LastUpdated"]);
						return dt.isValid() ? dt.format("MM/DD/YYYY") : "";
					},
					isUTC: true,
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
					Width: '160px',
					type: "string",
					hidden: true
				},
				{
					FieldName: "GeoCounty",
					DisplayName: "Map Set",
					DBName: "Geo_County",
					Width: '150px',
					type: "string",
					hidden: true,
					ListFilterTemplate: TF.ListFilterDefinition.ListFilterTemplate.DistinctListValue("Mapset", "school", "GeoCounty")
				},
				{
					FieldName: "Comments",
					DisplayName: "Notes",
					Width: '150px',
					type: "string",
					hidden: true
				},
				{
					FieldName: "Private",
					DisplayName: "Private School",
					Width: '150px',
					type: "boolean",
					hidden: true
				},
				{
					FieldName: "Capacity",
					DisplayName: "Student Capacity",
					Width: '130px',
					type: "integer",
					hidden: true
				},
				{
					FieldName: "Phone",
					DisplayName: "Phone",
					Width: '130px',
					type: "string",
					hidden: true,
					formatType: "phone",
					template: function(item)
					{
						return tf.dataFormatHelper.phoneFormatter(item.Phone) || '';
					}
				},
				{
					FieldName: "DispGrade",
					Width: '150px',
					type: "string",
					hidden: true,
					onlyForFilter: true
				},
				{
					FieldName: "geoConfidence",
					Width: '150px',
					type: "integer",
					hidden: true,
					onlyForFilter: true
				},
				{
					FieldName: "Id",
					DBName: "SchoolID",
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
					type: "string",
					hidden: true,
					onlyForFilter: true
				}
			].concat(tf.UDFDefinition.getAvailableWithCurrentDataSource("school")),
			InvisibleUDFColumns: tf.UDFDefinition.getInvisibleUDFs("school")
		};
	};

	tf.schoolGridDefinition = new TF.GridDefinition.SchoolGridDefinition();
})();
