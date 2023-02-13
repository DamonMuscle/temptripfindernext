(function()
{
	createNamespace("TF.RoutingMap.RoutingPalette").OpenTripViewModel = OpenTripViewModel;

	function OpenTripViewModel(selectedData, options, disableControl)
	{
		options.getSelectableRecords = this._getSelectableRecords.bind(this);
		options.filterSelectableRecords = this._filterSelectableRecords.bind(this);
		options.getRequiredColumns = this.getRequiredColumns;
		options.withRelationShip = true;
		TF.Control.KendoListMoverWithSearchControlViewModel.call(this, selectedData, options);
		this.obDisableControl = disableControl;
	}

	OpenTripViewModel.prototype = Object.create(TF.Control.KendoListMoverWithSearchControlViewModel.prototype);
	OpenTripViewModel.prototype.constructor = OpenTripViewModel;

	OpenTripViewModel.prototype.columnSources = {
		trip: [
			{
				FieldName: "Name",
				DisplayName: "Name",
				Width: "200px",
				type: "string",
				isSortItem: true
			},
			{
				FieldName: "SessionName",
				DisplayName: "Session",
				Width: "110px",
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
				FieldName: "TravelScenarioName",
				DisplayName: " TravelScenario",
				Width: "150px",
				type: "string",
			},
			{
				FieldName: "StartTime",
				DisplayName: "Start Time",
				Width: "150px",
				type: "time",
				template: "#: convertToMoment(StartTime).format('LT')#"
			},
			{
				FieldName: "FinishTime",
				DisplayName: "Finish Time",
				Width: "150px",
				type: "time",
				template: "#: convertToMoment(FinishTime).format('LT')#"
			}
		]
	};

	OpenTripViewModel.prototype._getLeftColumns = function()
	{
		var rightColumns = TF.Control.KendoListMoverWithSearchControlViewModel.prototype._getLeftColumns.call(this);
		var menuColumns = [
			{
				field: "lock_menu",
				title: "<div></div>",
				width: "30px",
				sortable: false,
				filterable: false,
				locked: true,
				headerTemplate: "<div class='iconbutton lock'></div>",
				template: "<div class='#:isLocked?'iconbutton lock-black':''#' title='#:lockedByUser#'></div>"
			}
		];
		return menuColumns.concat(rightColumns);
	};

	OpenTripViewModel.prototype._getSourceFromResponse = function(response)
	{
		let p1 = TF.Control.KendoListMoverWithSearchControlViewModel.prototype._getSourceFromResponse.call(this, response).then(records => records);
		let p2 = tf.promiseAjax.get(pathCombine(tf.api.apiPrefixWithoutDatabase("v2"), "travelscenarios")).then(data => data.Items);
		let p3 = this.options.getLockedInfo().then(lockedInfo => lockedInfo);
		return Promise.all([p1, p2, p3]).then(result =>
		{
			let records = result[0], travelScenario = result[1], lockedInfo = result[2];
			records.forEach(item =>
			{
				var locked = Enumerable.From(lockedInfo || []).FirstOrDefault(null, c => c.Id == item.Id);
				item.isLocked = !!locked;
				item.lockedByUser = TF.RoutingMap.LockData.displayLockedUser(locked);
				var travelScenarioEntity = Enumerable.From(travelScenario).FirstOrDefault(null, r => item.TravelScenarioId == r.Id);
				if (travelScenarioEntity != null)
				{
					item.TravelScenarioName = travelScenarioEntity.Name;
				}
			});
			return records;
		});
	};

	OpenTripViewModel.prototype._filterSelectableRecords = function(leftData, rightData)
	{
		if (!rightData.length)
		{
			return leftData;
		}

		return leftData.filter(l =>
		{
			if (l.isLocked)
			{
				return false;
			}

			var isSelectableTrip = false;
			rightData.forEach(r =>
			{
				if (TF.RoutingMap.RoutingPalette.RoutingDataModel.checkCriteria(r, l))
				{
					isSelectableTrip = true;
				}
			});

			return isSelectableTrip;
		});
	};

	OpenTripViewModel.prototype._getSelectableRecords = function(source, selected)
	{
		var sourceUnLocked = source.filter(function(trip)
		{
			return !trip.isLocked;
		});

		if (!selected || selected.length == 0)
		{
			return sourceUnLocked;
		}

		return sourceUnLocked.filter(function(trip)
		{
			return TF.RoutingMap.RoutingPalette.RoutingDataModel.checkCriteria(selected[0], trip);
		});
	};

	OpenTripViewModel.prototype.afterInit = function()
	{
		// do not create clear all filter button
		this.leftSearchGrid.createFilterClearAll = function() { };
	};

	OpenTripViewModel.prototype.apply = function()
	{
		return new Promise(function(resolve)
		{
			resolve(this.selectedData);
		}.bind(this));
	};

	OpenTripViewModel.prototype.cancel = function()
	{
		return new Promise(function(resolve)
		{
			resolve(true);
		});
	};

	OpenTripViewModel.prototype.filterMenuClick = function(model, e)
	{
		this.createFilterMenu(model, e);
	};

	OpenTripViewModel.prototype.getRequiredColumns = function()
	{
		return ['Session', 'BusAide', 'Disabled', 'FilterName', 'NonDisabled', 'Schools', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday', 'StartDate', 'EndDate', 'FilterSpec', 'TravelScenarioId'];
	};

	OpenTripViewModel.prototype.onBeforeLeftGridDataBound = function()
	{
	};

})();
