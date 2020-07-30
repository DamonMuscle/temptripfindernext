(function()
{
	createNamespace("TF.GridDefinition").GPSEventGridDefinition = GPSEventGridDefinition;

	function GPSEventGridDefinition() { }

	GPSEventGridDefinition.prototype.gridDefinition = function()
	{
		return {
			Columns: [{
				FieldName: "VehicleExternalName",
				DisplayName: "Vehicle",
				Width: '150px',
				type: "string",
				ListFilterTemplate: TF.ListFilterDefinition.ListFilterTemplate.BusfinderHistoricalVehicle
			}, {
				FieldName: "Time",
				DisplayName: "Time",
				Width: '150px',
				type: "time",
				format: "{0:h:mm:ss tt}",
				//onlyForGrid: true
			}, {
				FieldName: "DayOfTheWeek",
				DisplayName: "Day of the Week",
				Width: '150px',
				type: "string",
				ListFilterTemplate: TF.ListFilterDefinition.ListFilterTemplate.DaysOfTheWeek,
				//onlyForGrid: true
			}, {
				FieldName: "EventDate",
				DisplayName: "Event Date",
				Width: '150px',
				type: "date",
				//onlyForGrid: true
			}, {
				FieldName: "EventName",
				DisplayName: "Event",
				Width: '150px',
				type: "string",
				ListFilterTemplate: TF.ListFilterDefinition.ListFilterTemplate.GPSEventType
			}, {
				FieldName: "AdjLocation",
				DisplayName: "Location",
				Width: '150px',
				type: "string"
			}, {
				FieldName: "TripName",
				DisplayName: "Trip Name",
				Width: '150px',
				type: "string",
				ListFilterTemplate: {
					DisplayFilterTypeName: "Trips",
					// ViewModel:TF.Modal.ListMoverForListFilterControlModalViewModel,
					listFilterType: 'WithSearchGrid',
					setLeftGridRequestOption: this.setTripModalLeftGridRequestOption,
					setRightGridRequestOption: this.setTripModelRightGridRequestOption,

					GridType: "BusfinderHistoricalTrip",
					filterField: "Name",
					displayCheckbox: true,
					filterCheckboxText: "Trips in progress",
					filterSetField: "InProgress",
					editCurrentDefinitionColumns: true,
					getUrl: function()
					{
						return pathCombine(tf.api.apiPrefix(), "tripsummarygridnostatistic");
					}
				}
			}, {
				FieldName: "StopName",
				DisplayName: "Stop Name",
				Width: '150px',
				type: "string",
				ListFilterTemplate: {
					DisplayFilterTypeName: "Trip Stops",
					listFilterType: 'WithSearchGrid',
					editCurrentDefinitionColumns: true,
					GridType: "BusfinderHistoricalTripStop",
					filterField: "Street",
					getUrl: function()
					{
						return pathCombine(tf.api.apiPrefix(), "search", "tripstop");
					}
				}
			}, {
				FieldName: "OnPathStatusName",
				DisplayName: "On Path Status",
				Width: '150px',
				type: "string",
				template: function(data)
				{
					return (data.OnPathStatusName.indexOf("n/a") >= 0 ? "" : "<div class='left-color-icon square' style='background-color:"
						+ TF.Color.toHTMLColorFromLongColor(data.OnPathDisplayColor)
						+ ";'></div>") + data.OnPathStatusName;
				},
				ListFilterTemplate: TF.ListFilterDefinition.ListFilterTemplate.OnPathStatuses
			}, {
				FieldName: "AtSpeedStatusName",
				DisplayName: "At Speed Status",
				Width: '150px',
				type: "string",
				template: function(data)
				{
					return (data.AtSpeedStatusName.indexOf("n/a") >= 0 ? "" : "<div class='left-color-icon square' style='background-color:"
						+ TF.Color.toHTMLColorFromLongColor(data.AtSpeedDisplayColor)
						+ ";'></div>") + data.AtSpeedStatusName;
				},
				ListFilterTemplate: TF.ListFilterDefinition.ListFilterTemplate.AtSpeedStatuses
			}, {
				FieldName: "AtStopStatusName",
				DisplayName: "At Stop Status",
				Width: '150px',
				type: "string",
				template: function(data)
				{
					return (data.AtStopStatusName.indexOf("n/a") >= 0 ? "" : "<div class='left-color-icon square' style='background-color:"
						+ TF.Color.toHTMLColorFromLongColor(data.AtStopDisplayColor)
						+ ";'></div>") + data.AtStopStatusName;

				},
				ListFilterTemplate: TF.ListFilterDefinition.ListFilterTemplate.AtStopStatuses
			},
			{
				FieldName: "DistanceToStopText",
				DisplayName: "Distance to Stop",
				Width: '150px',
				type: "string",
				//onlyForGrid: true
			}, {
				FieldName: "DriverName",
				DisplayName: "Driver",
				Width: '150px',
				type: "string",
				ListFilterTemplate: TF.ListFilterDefinition.ListFilterTemplate.Staff.Driver.DriverName
			}, {
				FieldName: "HeadingText",
				DisplayName: "Heading",
				Width: '150px',
				type: "string",
				ListFilterTemplate: TF.ListFilterDefinition.ListFilterTemplate.Directions
			}, {
				FieldName: "OnTimeForStopEventStatusName",
				DisplayName: "On Time For Stop Status",
				Width: '150px',
				type: "string",
				template: function(data)
				{
					return (data.OnTimeForStopEventStatusName.indexOf("n/a") >= 0 ? "" : "<div class='left-color-icon square' style='background-color:"
						+ TF.Color.toHTMLColorFromLongColor(data.OnTimeForStopDisplayColor)
						+ ";'></div>") + data.OnTimeForStopEventStatusName;
				},
				ListFilterTemplate: TF.ListFilterDefinition.ListFilterTemplate.OnTimeForStopStatuses
			}, {
				FieldName: "PlannedStopTime",
				DisplayName: "Planned Stop Time",
				Width: '150px',
				type: "string",
				//onlyForGrid: true
				//,format: "{0:h:mm:ss tt}"
			}, {
				FieldName: "StreetSpeed",
				DisplayName: "Posted Speed",
				Width: '150px',
				type: "integer"
			}, {
				FieldName: "Speed",
				DisplayName: "Speed",
				Width: '150px',
				type: "number",
				format: "{0:n1}"
			}]
		};
	};

	GPSEventGridDefinition.prototype.setTripModalLeftGridRequestOption = function(requestOptions, obShowEnabled)
	{
		requestOptions = TF.Control.KendoListMoverWithSearchControlViewModel.prototype.setLeftRequestOption.call(this, requestOptions);
		requestOptions.paramData.time = toISOStringWithoutTimeZone(moment().currentTimeZoneTime());
		requestOptions.paramData.date = requestOptions.paramData.time;
		if (!obShowEnabled)
		{
			requestOptions.data.filterSet = requestOptions.data.filterSet || {
				FilterItems: [], FilterSets: [], LogicalOperator: "and"
			};
			var filterItems = requestOptions.data.filterSet.FilterItems;
			filterItems = filterItems.filter(function(filterItem)
			{
				if (filterItem.FieldName !== "InProgress")
				{
					return true;
				}
				return false;
			});
			if (filterItems.length === 0)
				requestOptions.data.filterSet = null;
			else
				requestOptions.data.filterSet.FilterItems = filterItems;
		}

		return requestOptions;
	};

	GPSEventGridDefinition.prototype.setTripModelRightGridRequestOption = function(requestOptions)
	{
		requestOptions = TF.Control.KendoListMoverWithSearchControlViewModel.prototype.setRightRequestOption.call(this, requestOptions);
		requestOptions.paramData.time = toISOStringWithoutTimeZone(moment().currentTimeZoneTime());
		return requestOptions;
	};

	tf.gpsEventGridDefinition = new TF.GridDefinition.GPSEventGridDefinition();
})();
