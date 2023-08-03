(function()
{
	createNamespace("TF.GridDefinition").TripStopGridDefinition = TripStopGridDefinition;
	function TripStopGridDefinition()
	{
		//NOSONAR
	}

	TripStopGridDefinition.prototype.gridDefinition = function()
	{
		let definition = {
			Columns: [
				{
					FieldName: "Name",
					DisplayName: "Trip Name",
					Width: '350px',
					type: "string",
					ListFilterTemplate: TF.ListFilterDefinition.ListFilterTemplate.Trip
				},
				{
					FieldName: "Street",
					DisplayName: "Street",
					Width: '330px',
					type: "string"
				},
				{
					FieldName: "Comment",
					DisplayName: "Notes",
					Width: '150px',
					type: "string"
				},
				{
					FieldName: "StopTime",
					DisplayName: "Stop Time",
					Width: '150px',
					type: "time"
				},
				{
					FieldName: "NumStuds",
					DisplayName: "# Students",
					Width: '150px',
					type: "integer"
				},
				{
					FieldName: "SchlCode",
					DisplayName: "School Code",
					Width: '150px',
					type: "string",
					ListFilterTemplate: TF.ListFilterDefinition.ListFilterTemplate.School.SchoolCode
				},
				{
					FieldName: "Schoolname",
					DisplayName: "School Name",
					Width: '250px',
					type: "string",
					ListFilterTemplate: TF.ListFilterDefinition.ListFilterTemplate.School.Name
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
					FieldName: "Sequence",
					DisplayName: "Sequence",
					Width: '150px',
					type: "integer"
				},
				{
					FieldName: "DocumentCount",
					DisplayName: "# Documents",
					Width: '150px',
					type: "integer"
				},
				{
					FieldName: "City",
					DisplayName: "City",
					Width: '150px',
					type: "string",
					ListFilterTemplate: TF.ListFilterDefinition.ListFilterTemplate.DistinctListValue("GeoCity", "tripstop", "City")
				},
				{
					FieldName: "DrivingDirections",
					DisplayName: "Directions to Next Stop",
					Width: '500px',
					type: "string"
				},
				{
					FieldName: "Distance",
					DisplayName: "Distance to Next Stop",
					UnitOfMeasureSupported: true,
					Width: '160px',
					type: "number"
				},
				{
					FieldName: "AppPoint",
					DisplayName: "Approach Point",
					Width: '150px',
					type: "boolean",
					positiveValue: "1",
					includeEmptyValue: true,
					template: "<input type='checkbox' #: tf.georegionGridDefinition.gridDefinition().booleanToCheckboxFormatter(AppPoint)# onclick='return false' />"
				},
				{
					FieldName: "StreetNumber",
					DisplayName: "Street #",
					Width: '150px',
					type: "string"
				},
				{
					FieldName: "StreetName",
					DisplayName: "Street Name",
					Width: '250px',
					type: "string"
				},
				{
					FieldName: "ActualLoadTime",
					DisplayName: "Load Time",
					Width: '150px',
					type: "integer"
				},
				{
					FieldName: "CalculatedLoadTime",
					DisplayName: "Estimated Total Time",
					Width: '150px',
					type: "integer",
					hidden: true
				},
				{
					FieldName: "TotalStopTimeManualChanged",
					DisplayName: "Total Time Adjusted",
					Width: '150px',
					type: "boolean",
					hidden: true,
					template: "<input type='checkbox' #: tf.georegionGridDefinition.gridDefinition().booleanToCheckboxFormatter(TotalStopTimeManualChanged)# onclick='return false' />"
				},
				{
					FieldName: "IncludeNoStudStop",
					DisplayName: "Include Stop When No Students Assigned",
					Width: '150px',
					type: "boolean",
					hidden: true,
					template: "<input type='checkbox' #: tf.georegionGridDefinition.gridDefinition().booleanToCheckboxFormatter(IncludeNoStudStop)# onclick='return false' />"
				},
				{
					FieldName: "Tstopcount",
					DisplayName: "# Trip Stops",
					Width: '150px',
					type: "integer"
				},
				{
					FieldName: "ActivityTrip",
					DisplayName: "Activity Trip",
					Width: '150px',
					type: "boolean",
					template: "<input type='checkbox' #: tf.georegionGridDefinition.gridDefinition().booleanToCheckboxFormatter(ActivityTrip)# onclick='return false' />",
					hidden: true
				},
				{
					FieldName: "EstimatedRidership",
					DisplayName: "Actual Riders",
					Width: '150px',
					type: "integer",
					hidden: true
				},
				{
					FieldName: "BusAide",
					DisplayName: "Aide Required",
					DBName: "Bus_Aide",
					Width: '150px',
					type: "boolean",
					template: "<input type='checkbox' #: tf.georegionGridDefinition.gridDefinition().booleanToCheckboxFormatter(BusAide)# onclick='return false' />"
				},
				{
					FieldName: "TripAlias",
					DisplayName: "Alias",
					Width: '150px',
					type: "string",
					ListFilterTemplate: TF.ListFilterDefinition.ListFilterTemplate.DistinctListValue("GeneralDataListsTripAlias", "trip", "TripAlias")
				},
				{
					FieldName: "AideName",
					DisplayName: "Bus Aide",
					Width: '140px',
					type: "string",
					hidden: true
				},
				{
					FieldName: "TripGuid",
					DisplayName: "Trip GUID",
					Width: '180px',
					type: "string",
					hidden: true
				},
				{
					FieldName: "MaxOnBus",
					DisplayName: "Max On Bus",
					Width: '150px',
					type: "integer",
					hidden: true
				},
				{
					FieldName: "GPSEnabledFlag",
					DisplayName: "Trip Busfinder Enabled",
					Width: '140px',
					type: "boolean",
					template: function(item)
					{
						return item.GPSEnabledFlag ? "<input type='checkbox' #: tf.georegionGridDefinition.gridDefinition().booleanToCheckboxFormatter(true)# onclick='return false' />" :
							"<input type='checkbox' #: tf.georegionGridDefinition.gridDefinition().booleanToCheckboxFormatter(false)# onclick='return false' />";
					},
					hidden: true
				},
				{
					FieldName: "Cost",
					DisplayName: "Cost",
					Width: '150px',
					type: "number",
					hidden: true
				},
				{
					FieldName: "DateRange",
					DisplayName: "Trip Date Range",
					Width: '150px',
					type: "string",
					hidden: true
				},
				{
					FieldName: "Days",
					DisplayName: "Days",
					Width: '175px',
					type: "string",
					template: function(item)
					{
						let days = item.Days;
						if (days == null) return null;

						days = days.trim();
						if (days.endsWith(","))
						{
							return days.slice(0, -1);
						}

						return days;
					}
				},
				{
					FieldName: "Dhdistance",
					DisplayName: "Deadhead Distance",
					UnitOfMeasureSupported: true,
					Width: '150px',
					type: "number",
					format: "{0:0.00}"
				},
				{
					FieldName: "Description",
					DisplayName: "Trip Description",
					Width: '150px',
					type: "string"
				},
				{
					FieldName: "Disabled",
					DisplayName: "Disabled Students",
					Width: '130px',
					type: "boolean",
					template: "<input type='checkbox' #: tf.georegionGridDefinition.gridDefinition().booleanToCheckboxFormatter(Disabled)# onclick='return false' />"
				},
				{
					FieldName: "DriverName",
					DisplayName: "Driver",
					Width: '160px',
					type: "string",
					ListFilterTemplate: TF.ListFilterDefinition.ListFilterTemplate.Staff.Driver
				},
				{
					FieldName: "Duration",
					DisplayName: "Trip Duration",
					Width: '150px',
					type: "integer",
					hidden: true
				},
				{
					FieldName: "EndDate",
					DisplayName: "Trip End Date",
					Width: '150px',
					type: "date"
				},
				{
					FieldName: "EstDistancePerYear",
					DisplayName: "Est Distance/Year",
					UnitOfMeasureSupported: true,
					Width: '140px',
					type: "number",
					hidden: true
				},
				{
					FieldName: "EstHoursPerYear",
					DisplayName: "Est Hours/Year",
					Width: '150px',
					type: "number",
					format: "{0:0.00}",
					hidden: true
				},
				{
					FieldName: "ExcludeNoStudStopAndDirections",
					DisplayName: "Exclude Stops When No Students Assigned",
					DBName: "ExcludeNoStudStopAndDirections",
					Width: '150px',
					type: "boolean",
					template: "<input type='checkbox' #: tf.georegionGridDefinition.gridDefinition().booleanToCheckboxFormatter(ExcludeNoStudStopAndDirections)# onclick='return false' />"
				},
				{
					FieldName: "FilterName",
					DisplayName: "Filter Name",
					Width: '150px',
					type: "string",
					hidden: true
				},
				{
					FieldName: "FilterSpec",
					DisplayName: "Filter Spec",
					Width: '150px',
					type: "string",
					hidden: true
				},
				{
					FieldName: "FinishTime",
					DisplayName: "Trip Finish Time",
					Width: '150px',
					type: "time"
				},
				{
					FieldName: "HomeSchl",
					DisplayName: "Home To School",
					Width: '150px',
					type: "boolean",
					template: "<input type='checkbox' #: tf.georegionGridDefinition.gridDefinition().booleanToCheckboxFormatter(HomeSchl)# onclick='return false' />"
				},
				{
					FieldName: "HomeTrans",
					DisplayName: "Home To Transfer",
					Width: '150px',
					type: "boolean",
					template: "<input type='checkbox' #: tf.georegionGridDefinition.gridDefinition().booleanToCheckboxFormatter(HomeTrans)# onclick='return false' />"
				},
				{
					FieldName: "NonDisabled",
					DisplayName: "Non-Disabled Students",
					Width: '165px',
					type: "boolean",
					template: "<input type='checkbox' #: tf.georegionGridDefinition.gridDefinition().booleanToCheckboxFormatter(NonDisabled)# onclick='return false' />"
				},
				{
					FieldName: "Comments",
					DisplayName: "Trip Notes",
					Width: '150px',
					type: "string"
				},
				{
					FieldName: "NumTransport",
					DisplayName: "Trip Number Assigned",
					Width: '130px',
					type: "integer"
				},
				{
					FieldName: "RidershipEfficiencyPolicy",
					DisplayName: "Ridership Efficiency Policy",
					Width: '200px',
					type: "number",
					format: "{0:0.00}",
					hidden: true
				},
				{
					FieldName: "RidershipMaximumPolicy",
					DisplayName: "Ridership Maximum Policy",
					Width: '190px',
					type: "number",
					format: "{0:0.00}",
					hidden: true
				},
				{
					FieldName: "RidershipRatio",
					DisplayName: "Ridership Ratio",
					Width: '150px',
					type: "number",
					format: "{0:0.00}",
					hidden: true
				},
				{
					FieldName: "RidershipStatus",
					DisplayName: "Ridership Status",
					Width: '150px',
					type: "image",
					DBType: "string",
					template: '<div class="#: tf.tripGridDefinition.gridDefinition().getIconUrl_RidershipStatus(RidershipStatus)#"></div>',
					hidden: true
				},
				{
					FieldName: "Schools",
					DisplayName: "Trip Schools",
					Width: '150px',
					type: "string",
					template: "#: tf.tripGridDefinition.gridDefinition().formatter(Schools)#",
					ListFilterTemplate: TF.ListFilterDefinition.ListFilterTemplate.School.SchoolCode,
					hidden: true
				},
				{
					FieldName: "StartDate",
					DisplayName: "Trip Start Date",
					Width: '150px',
					type: "date",
					hidden: true
				},
				{
					FieldName: "StartTime",
					DisplayName: "Trip Start Time",
					Width: '150px',
					type: "time",
					hidden: true
				},
				{
					FieldName: "StudentStopPolicy",
					DisplayName: "Student Stop Policy",
					Width: '150px',
					type: "integer",
					hidden: true
				},
				{
					FieldName: "Shuttle",
					DisplayName: "Trip Transfer",
					Width: '150px',
					type: "boolean",
					template: "<input type='checkbox' #: tf.georegionGridDefinition.gridDefinition().booleanToCheckboxFormatter(Shuttle)# onclick='return false' />",
					hidden: true
				},
				{
					FieldName: "TravelScenarioName",
					DisplayName: "Travel Scenario",
					Width: '150px',
					type: "string",
					hidden: true
				},
				{
					FieldName: "SessionName",
					DisplayName: "Trip Session",
					Width: '150px',
					type: "string",
					hidden: true,
					ListFilterTemplate: TF.ListFilterDefinition.ListFilterTemplate.TripType
				},
				{
					FieldName: "VehicleName",
					DisplayName: "Vehicle Name",
					Width: '150px',
					type: "string",
					ListFilterTemplate: TF.ListFilterDefinition.ListFilterTemplate.Vehicle,
					hidden: true
				},
				{
					FieldName: "VehicleGpsid",
					DisplayName: "Vehicle GPS ID",
					Width: '150px',
					type: "string",
					hidden: true
				},
				{
					FieldName: "VehicleCapacity",
					DisplayName: "Vehicle Capacity",
					Width: '150px',
					type: "integer",
					hidden: true
				},
				{
					FieldName: "WheelChairCapacity",
					DisplayName: "Wheelchair Capacity",
					Width: '140px',
					type: "integer",
					hidden: true
				},
				{
					FieldName: "TripDistance",
					DisplayName: "Trip Distance",
					UnitOfMeasureSupported: true,
					Width: '140px',
					type: "number",
					format: "{0:0.00}",
					hidden: true
				},
				{
					FieldName: "ApproachXCoord",
					Width: '150px',
					type: "number",
					hidden: true,
					onlyForFilter: true
				},
				{
					FieldName: "ApproachYCoord",
					Width: '150px',
					type: "number",
					hidden: true,
					onlyForFilter: true
				},
				{
					FieldName: "AvgSpeed",
					Width: '150px',
					type: "number",
					hidden: true,
					onlyForFilter: true,
					UnitOfMeasureSupported: true,
				},
				{
					FieldName: "BdyType",
					DBName: "Bdy_Type",
					Width: '150px',
					type: "integer",
					hidden: true,
					onlyForFilter: true
				},
				{
					FieldName: "Guid",
					Width: '150px',
					type: "string",
					hidden: true,
					onlyForFilter: true
				},
				{
					FieldName: "LastUpdated",
					DisplayName: "Last Updated Date",
					Width: '160px',
					dbType: "datetime",
					type: "date",
					hidden: true,
					onlyForFilter: true,
					template: function(item)
					{
						let dt = utcToClientTimeZone(item["LastUpdated"]);
						return dt.isValid() ? dt.format("MM/DD/YYYY") : "";
					},
					isUTC: true,
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
					Width: '130px',
					type: "string",
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
					FieldName: "NumDOShut",
					Width: '150px',
					type: "integer",
					hidden: true,
					onlyForFilter: true
				},
				{
					FieldName: "NumPUShut",
					Width: '150px',
					type: "integer",
					hidden: true,
					onlyForFilter: true
				},
				{
					FieldName: "NumTrans",
					Width: '150px',
					type: "integer",
					hidden: true,
					onlyForFilter: true
				},
				{
					FieldName: "Sifchanged",
					Width: '150px',
					type: "integer",
					hidden: true,
					onlyForFilter: true
				},
				{
					FieldName: "TotalStopTime",
					Width: '150px',
					type: "integer",
					hidden: true,
					onlyForFilter: true
				},
				{
					FieldName: "TripId",
					DBName: "TripId",
					Width: '150px',
					type: "integer",
					hidden: true,
					onlyForFilter: true
				},
				{
					FieldName: "Id",
					DBName: "tripstopid",
					Width: '150px',
					type: "integer",
					hidden: true,
					onlyForFilter: true
				},
				{
					FieldName: "Xstop",
					Width: '150px',
					type: "boolean",
					hidden: true,
					onlyForFilter: true
				},
				{
					FieldName: "IShow",
					DisplayName: "Infofinder i Visible",
					Width: '150px',
					type: "boolean"
				}
			].concat(tf.UDFDefinition.getAvailableWithCurrentDataSource("tripstop")),
			InvisibleUDFColumns: tf.UDFDefinition.getInvisibleUDFs("tripstop"),
			formatter: _formatter,
			getIconUrl: _getIconUrl
		};
		if (!tf.authManager.hasInfofinderi())
		{
			definition.Columns = definition.Columns.filter(x => x.FieldName != 'IShow');
		}
		return definition;
	};

	function _formatter(value)
	{
		const fromSchoolOrShuttle = value === 1 ? "From School" : "Shuttle";
		return value == 0 ? "To School" : fromSchoolOrShuttle;
	}

	function _getIconUrl(value)
	{
		if (value == "6")
			return 'grid-icon grid-icon-lock';
	}

	tf.tripStopGridDefinition = new TF.GridDefinition.TripStopGridDefinition();
})();
