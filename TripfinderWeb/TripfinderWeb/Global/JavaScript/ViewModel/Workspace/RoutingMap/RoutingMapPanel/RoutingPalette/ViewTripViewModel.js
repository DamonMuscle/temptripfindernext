(function()
{
	createNamespace("TF.RoutingMap.RoutingPalette").ViewTripViewModel = ViewTripViewModel;

	function ViewTripViewModel(selectedData, options, unavailableData, disableControl)
	{
		// options.getSelectableRecords = this._getSelectableRecords.bind(this);
		this.unavailableData = unavailableData;
		TF.Control.KendoListMoverWithSearchControlViewModel.call(this, selectedData, options);
		this.obDisableControl = disableControl;
	}

	ViewTripViewModel.prototype = Object.create(TF.Control.KendoListMoverWithSearchControlViewModel.prototype);
	ViewTripViewModel.prototype.constructor = ViewTripViewModel;

	ViewTripViewModel.prototype.columnSources = {
		trip: [
			{
				FieldName: "Name",
				DisplayName: "Name",
				Width: "150px",
				type: "string",
				isSortItem: true
			},
			{
				FieldName: "SessionName",
				DisplayName: "Session",
				Width: "150px",
				type: "string"
			},
			{
				FieldName: "Schools",
				DisplayName: " Schools",
				Width: "150px",
				type: "string",
				template: "#: tf.tripGridDefinition.gridDefinition().formatter(Schools)#",
			},
			{
				FieldName: "StartTime",
				DisplayName: "Start Time",
				Width: "150px",
				type: "time"
			},
			{
				FieldName: "FinishTime",
				DisplayName: "Finish Time",
				Width: "150px",
				type: "time"
			}
		]
	};

	ViewTripViewModel.prototype._getSourceFromResponse = function(response)
	{
		var self = this;
		return TF.Control.KendoListMoverWithSearchControlViewModel.prototype._getSourceFromResponse.call(this, response)
			.then(function(records)
			{
				records = records.filter(function(record)
				{
					var available = true;
					self.unavailableData.some(function(data)
					{
						if (data.Id == record.Id)
						{
							available = false;
							return true;
						}
					});
					return available;
				});
				return records;
			});
	};

	ViewTripViewModel.prototype.afterInit = function()
	{
		// do not create clear all filter button
		this.leftSearchGrid.createFilterClearAll = function() { };
	};

	ViewTripViewModel.prototype.apply = function()
	{
		return new Promise(function(resolve)
		{
			resolve(this.selectedData);
		}.bind(this));
	};

	ViewTripViewModel.prototype.cancel = function()
	{
		return new Promise(function(resolve)
		{
			resolve(true);
		});
	};

	ViewTripViewModel.prototype.filterMenuClick = function()
	{
	};

	ViewTripViewModel.prototype.onBeforeLeftGridDataBound = function()
	{
	};

})();
