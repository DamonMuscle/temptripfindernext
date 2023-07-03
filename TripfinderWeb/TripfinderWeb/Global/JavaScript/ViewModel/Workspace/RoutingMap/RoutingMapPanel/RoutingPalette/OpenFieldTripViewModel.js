(function()
{
	createNamespace("TF.RoutingMap.RoutingPalette").OpenFieldTripViewModel = OpenFieldTripViewModel;

	function OpenFieldTripViewModel(selectedData, options, disableControl)
	{
		options.getSelectableRecords = this._getSelectableRecords.bind(this);
		options.filterSelectableRecords = this._filterSelectableRecords.bind(this);
		options.getRequiredColumns = this.getRequiredColumns;
		options.withRelationShip = true;
		TF.Control.KendoListMoverWithSearchControlViewModel.call(this, selectedData, options);
		this.obDisableControl = disableControl;
	}

	OpenFieldTripViewModel.prototype = Object.create(TF.Control.KendoListMoverWithSearchControlViewModel.prototype);
	OpenFieldTripViewModel.prototype.constructor = OpenFieldTripViewModel;

	OpenFieldTripViewModel.prototype.columnSources = {
		fieldtrip: [
			{
				FieldName: "Name",
				DisplayName: "Name",
				Width: "200px",
				type: "string",
				isSortItem: true
			},
			{
				FieldName: "DepartFromSchool",
				DisplayName: "Depart From",
				Width: '150px',
				type: "string"
			},
			{
				FieldName: "School",
				DisplayName: "School",
				Width: '150px',
				type: "string",
				ListFilterTemplate: TF.ListFilterDefinition.ListFilterTemplate.School.SchoolCode
			},
			{
				FieldName: "SchoolName",
				DisplayName: "School Name",
				Width: '250px',
				type: "string",
				ListFilterTemplate: TF.ListFilterDefinition.ListFilterTemplate.School
			},
			{
				FieldName: "ReturnDate",
				DisplayName: "Return Date",
				Width: '160px',
				type: "date"
			},
			{
				FieldName: "FieldTripContact",
				DisplayName: "Contact",
				Width: '150px',
				type: "string"
			},
			{
				FieldName: "ContactPhone",
				DisplayName: "Contact Phone",
				Width: '150px',
				type: "string",
				formatType: "phone",
				template: function(item)
				{
					return tf.dataFormatHelper.phoneFormatter(item.ContactPhone) || '';
				}
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
				type: "string",
				attributes: {
					"class": "k-link"
				}
			},
			{
				FieldName: "Notes",
				DisplayName: "Notes",
				Width: '150px',
				type: "string"
			},
			{
				FieldName: "Destination",
				Width: '150px',
				type: "string",
				ListFilterTemplate: TF.ListFilterDefinition.ListFilterTemplate.DistinctListValue("FieldTripDestination", "fieldtrip", "Destination")
			},
			{
				FieldName: "DestinationContact",
				DisplayName: "Destination Contact",
				Width: '160px',
				type: "string"
			},
			{
				FieldName: "DestinationContactPhone",
				DisplayName: "Destination Contact Phone",
				Width: '190px',
				type: "string",
				formatType: "phone",
				template: function(item)
				{
					return tf.dataFormatHelper.phoneFormatter(item.DestinationContactPhone) || '';
				}
			},
			{
				FieldName: "DepartDate",
				DisplayName: "Departure Date",
				Width: '160px',
				type: "date"
			}
		]
	};

	OpenFieldTripViewModel.prototype._getLeftColumns = function()
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

	OpenFieldTripViewModel.prototype._getSourceFromResponse = function(response)
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

	OpenFieldTripViewModel.prototype._filterSelectableRecords = function(leftData, rightData)
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
				if (TF.RoutingMap.RoutingPalette.RoutingDataModel.checkFieldTripCriteria(r, l))
				{
					isSelectableTrip = true;
				}
			});

			return isSelectableTrip;
		});
	};

	OpenFieldTripViewModel.prototype._getSelectableRecords = function(source, selected)
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
			return TF.RoutingMap.RoutingPalette.RoutingDataModel.checkFieldTripCriteria(selected[0], trip);
		});
	};

	OpenFieldTripViewModel.prototype.afterInit = function()
	{
		// do not create clear all filter button
		this.leftSearchGrid.createFilterClearAll = function() { };
	};

	OpenFieldTripViewModel.prototype.apply = function()
	{
		return new Promise(function(resolve)
		{
			this.prepareData(this.selectedData).then(()=>resolve(this.selectedData));
		}.bind(this));
	};

	OpenFieldTripViewModel.prototype.prepareData = function(fieldTrips)
	{
		const fieldTripIds = fieldTrips.map(x => x.Id);
		return tf.promiseAjax.get(pathCombine(tf.api.apiPrefix(),"fieldtripstops"),{
			paramData:{
				"@filter":`in(FieldTripId,${fieldTripIds.join(",")})`
			}
		}).then(function(response){
			const existingItems = response.Items,
				addingItems = [],
				updateinItems = [];

			 fieldTrips.forEach(function(fieldTrip)
			 {
				const schoolStop = {
						DBID: fieldTrip.DBID,
						FieldTripId: fieldTrip.Id,
						PrimaryDeparture: true,
						Xcoord: fieldTrip.SchoolXCoord,
						Ycoord: fieldTrip.SchoolYCoord,
						Street: fieldTrip.SchoolName,
						FieldTripDestinationId: 0,
						Sequence: 1,
						StopTimeDepart: fieldTrip.DepartDate
					},
					terminalStop = {
						DBID: fieldTrip.DBID,
						FieldTripId: fieldTrip.Id,
						PrimaryDestination: true,
						Xcoord: fieldTrip.FieldTripDestinationXCoord,
						Ycoord: fieldTrip.FieldTripDestinationYCoord,
						FieldTripDestinationId: fieldTrip.FieldTripDestinationId,
						Street: fieldTrip.DestinationStreet || fieldTrip.Destination,
						Sequence: existingItems.filter(x => x.FieldTripId == fieldTrip.Id && !item.PrimaryDeparture && !item.PrimaryDestination).length + 2,
					};

				if(!existingItems.some(item => item.PrimaryDeparture && item.FieldTripId == fieldTrip.Id))
				{
					addingItems.push(schoolStop);
				}
				else
				{
					updateinItems.push($.extend({},existingItems.find(item => item.PrimaryDeparture && item.FieldTripId == fieldTrip.Id),schoolStop));
				}

				if(!existingItems.some(item => item.PrimaryDestination && item.FieldTripId == fieldTrip.Id))
				{
					addingItems.push(terminalStop);
				}
				else
				{
					updateinItems.push($.extend({},existingItems.find(item => item.PrimaryDestination && item.FieldTripId == fieldTrip.Id),terminalStop));
				}
			});

			const p = [];
			if(addingItems.length)
			{
				p.push(tf.promiseAjax.post(pathCombine(tf.api.apiPrefix(),"fieldtripstops"), {data: addingItems}));
			}
			if(updateinItems.length)
			{
				p.push(tf.promiseAjax.put(pathCombine(tf.api.apiPrefix(),"fieldtripstops"), {data: updateinItems}));
			}

			return Promise.all(p);
		});
	};

	OpenFieldTripViewModel.prototype.cancel = function()
	{
		return new Promise(function(resolve)
		{
			resolve(true);
		});
	};

	OpenFieldTripViewModel.prototype.filterMenuClick = function(model, e)
	{
		this.createFilterMenu(model, e);
	};

	OpenFieldTripViewModel.prototype.getRequiredColumns = function()
	{
		return ['Session', 'BusAide', 'Disabled', 'FilterName', 'NonDisabled', 'Schools', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday', 'StartDate', 'EndDate', 'FilterSpec', 'TravelScenarioId'];
	};

	OpenFieldTripViewModel.prototype.onBeforeLeftGridDataBound = function()
	{
	};

})();
