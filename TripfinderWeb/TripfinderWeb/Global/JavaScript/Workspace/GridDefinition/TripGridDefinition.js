(function()
{
	createNamespace("TF.GridDefinition").TripGridDefinition = TripGridDefinition;
	function TripGridDefinition()
	{
	}

	TripGridDefinition.prototype.gridDefinition = function()
	{
		return {
			Columns: [
				{
					FieldName: "Name",
					DisplayName: "Name",
					DBName: "Name",
					Width: '370px',
					type: "string",
					ListFilterTemplate: TF.ListFilterDefinition.ListFilterTemplate.Trip
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
					FieldName: "AideName",
					DisplayName: "Bus Aide",
					Width: '150px',
					type: "string",
					ListFilterTemplate: TF.ListFilterDefinition.ListFilterTemplate.Staff.BusAide
				},
				{
					FieldName: "Tstopcount",
					DisplayName: "# Stops",
					Width: '150px',
					type: "integer"
				},
				{
					FieldName: "Dhdistance",
					DisplayName: "Deadhead " + tf.localization.UnitsOfMeasure,
					Width: '150px',
					type: "number",
					format: "{0:0.00}"
				},
				{
					FieldName: "Description",
					DisplayName: "Description",
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
					FieldName: "Distance",
					DisplayName: "Distance",
					Width: '150px',
					type: "number",
					format: "{0:0.00}"
				},
				{
					FieldName: "DriverName",
					DisplayName: "Driver",
					Width: '160px',
					type: "string",
					ListFilterTemplate: TF.ListFilterDefinition.ListFilterTemplate.Staff.Driver
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
					FieldName: "NonDisabled",
					DisplayName: "Non-Disabled Students",
					Width: '165px',
					type: "boolean",
					template: "<input type='checkbox' #: tf.georegionGridDefinition.gridDefinition().booleanToCheckboxFormatter(NonDisabled)# onclick='return false' />"
				},
				{
					FieldName: "Schools",
					Width: '150px',
					type: "string",
					template: "#: tf.tripGridDefinition.gridDefinition().formatter(Schools)#",
					ListFilterTemplate: TF.ListFilterDefinition.ListFilterTemplate.School.SchoolCode
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
					ListFilterTemplate: TF.ListFilterDefinition.ListFilterTemplate.Vehicle
				},
				{
					FieldName: "VehicleCapacity",
					DisplayName: "Vehicle Capacity",
					Width: '150px',
					type: "integer"
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
					FieldName: "Shuttle",
					DisplayName: "Transfer",
					Width: '150px',
					type: "boolean",
					template: "<input type='checkbox' #: tf.georegionGridDefinition.gridDefinition().booleanToCheckboxFormatter(Shuttle)# onclick='return false' />"
				},
				{
					FieldName: "TravelScenarioName",
					DisplayName: "Travel Scenario",
					Width: '150px',
					type: "string"
				},
				{
					FieldName: "Comments",
					DisplayName: "Notes",
					Width: '150px',
					type: "string"
				},
				{
					FieldName: "NumTransport",
					DisplayName: "Number Assigned",
					Width: '130px',
					type: "integer"
				},
				{
					FieldName: "MaxOnBus",
					DisplayName: "Max On Bus",
					Width: '150px',
					type: "integer",
					hidden: true
				},
				{
					FieldName: "StartDate",
					DisplayName: "Start Date",
					Width: '150px',
					type: "date"
				},
				{
					FieldName: "EndDate",
					DisplayName: "End Date",
					Width: '150px',
					type: "date"
				},
				{
					FieldName: "StartTime",
					DisplayName: "Start Time",
					Width: '150px',
					type: "time"
				},
				{
					FieldName: "FinishTime",
					DisplayName: "Finish Time",
					Width: '150px',
					type: "time"
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
					FieldName: "DateRange",
					DisplayName: "Date Range",
					Width: '150px',
					type: "string",
					hidden: true
				},
				{
					FieldName: "TripAlias",
					DisplayName: "Alias",
					Width: '150px',
					type: "string",
					ListFilterTemplate: TF.ListFilterDefinition.ListFilterTemplate.DistinctListValue("GeneralDataListsTripAlias", "trip", "TripAlias")
				},
				{
					FieldName: "Cost",
					DisplayName: "Cost",
					Width: '150px',
					type: "number",
					hidden: true
				},
				{
					FieldName: "IShow",
					DisplayName: "Infofinder i Visible",
					DBName: "I_Show",
					Width: '130px',
					type: "boolean",
					template: "<input type='checkbox' #: tf.georegionGridDefinition.gridDefinition().booleanToCheckboxFormatter(IShow)# onclick='return false' />",
					hidden: true
				},
				{
					FieldName: "IName",
					DisplayName: "Infofinder i Display Name",
					DBName: "I_Name",
					Width: '135px',
					type: "string",
					hidden: true
				},
				{
					FieldName: "IDescription",
					DisplayName: "Infofinder i Description",
					DBName: "I_Description",
					Width: '170px',
					type: "string",
					hidden: true
				},
				{
					FieldName: "LastUpdated",
					DisplayName: "Last Updated Date",
					Width: '160px',
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
					FieldName: "Guid",
					DisplayName: "GUID",
					Width: '285px',
					type: "string",
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
					FieldName: "Duration",
					Width: '150px',
					type: "integer",
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
					FieldName: "TargetRiders",
					DisplayName: "Target Riders",
					Width: '150px',
					type: "integer",
					hidden: true
				},
				{
					FieldName: "TargetAssigned",
					DisplayName: "Target Assigned",
					Width: '150px',
					type: "integer",
					hidden: true
				},
				{
					FieldName: "EstDistancePerYear",
					DisplayName: "Est Distance/Year",
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
					FieldName: "StudentStopPolicy",
					DisplayName: "Student Stop Policy",
					Width: '150px',
					type: "integer",
					hidden: true
				},
				{
					FieldName: "PolicyDeviation",
					DisplayName: "Policy Deviation",
					Width: '150px',
					type: "image",
					DBType: "integer",
					template: '<div class="#: tf.tripGridDefinition.gridDefinition().getIconUrl_PolicyDeviation(PolicyDeviation)#"></div>',
					hidden: true
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
					FieldName: "MaxRiders",
					DisplayName: "Max Riders",
					Width: '150px',
					type: "integer",
					hidden: true
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
					FieldName: "GpsenabledFlag",
					DisplayName: "Busfinder Enabled",
					Width: '140px',
					type: "boolean",
					template: "<input type='checkbox' #: tf.georegionGridDefinition.gridDefinition().booleanToCheckboxFormatter(GpsenabledFlag)# onclick='return false' />",
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
					FieldName: "AideId",
					DBName: "Aide_ID",
					Width: '150px',
					type: "integer",
					hidden: true,
					onlyForFilter: true
				},
				{
					FieldName: "Day",
					Width: '150px',
					type: "integer",
					hidden: true,
					onlyForFilter: true
				},
				{
					FieldName: "DriverId",
					DBName: "Driver_ID",
					Width: '150px',
					type: "integer",
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
					FieldName: "IntGratDate1",
					Width: '150px',
					type: "date",
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
					FieldName: "SIFChanged",
					Width: '150px',
					type: "integer",
					hidden: true,
					onlyForFilter: true
				},
				{
					FieldName: "Id",
					DBName: "trip_id",
					Width: '150px',
					type: "integer",
					hidden: true,
					onlyForFilter: true
				},
				{
					FieldName: "VehicleId",
					DBName: "Vehicle_ID",
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
			].concat(tf.UDFDefinition.getAvailableWithCurrentDataSource("trip")),
			InvisibleUDFColumns: tf.UDFDefinition.getInvisibleUDFs("trip"),
			formatter: function(value)
			{
				if (!value)
				{
					return "";
				}
				var result = value.replace(/!/g, ",");
				if (result.substr(value, length - 1, 1) == ",")
					result = result.substr(0, value.length - 1);
				return result;
			},
			getIconUrl_PolicyDeviation: function(value)
			{
				if (value == '37')
				{
					return 'grid-icon grid-icon-reddot';
				}
				else
				{
					return '';
				}
			},
			getIconUrl_RidershipStatus: function(value)
			{
				if (value == "37")
				{
					return 'grid-icon grid-icon-reddot';
				}
				else if (value == "39")
				{
					return 'grid-icon grid-icon-yellowdot';
				}
				else
				{
					return '';
				}
			},
			getIconUrl_IsLocked: function(value)
			{
				if (value == "6")
					return 'grid-icon grid-icon-lock';
			}
		}
	};

	tf.tripGridDefinition = new TF.GridDefinition.TripGridDefinition();
})();
