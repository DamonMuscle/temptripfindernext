(function()
{
	createNamespace("TF.RoutingMap.RoutingPalette").ViewFieldTripViewModel = ViewFieldTripViewModel;

	function ViewFieldTripViewModel(selectedData, options, unavailableData, disableControl)
	{
		// options.getSelectableRecords = this._getSelectableRecords.bind(this);
		this.unavailableData = unavailableData;
		options.getRequiredColumns = this.getRequiredColumns;
		options.needAdjustUtcColumnsForClientFilter = true;
		options.needneedUpdateSchemaOnRebuildGrid = true;
		TF.Control.KendoListMoverWithSearchControlViewModel.call(this, selectedData, options);
		this.obDisableControl = disableControl;
	}

	ViewFieldTripViewModel.prototype = Object.create(TF.Control.KendoListMoverWithSearchControlViewModel.prototype);
	ViewFieldTripViewModel.prototype.constructor = ViewFieldTripViewModel;

	ViewFieldTripViewModel.prototype.columnSources = {
		fieldtrip: [
			{
				FieldName: "PublicId",
				DisplayName: "ID",
				Width: '80px',
				type: "string",
				isSortItem: true
			},
			{
				FieldName: "FieldTripStageName",
				DisplayName: "Status",
				Width: '200px',
				type: "string",
				template: `<div style='height:15px;width:15px;margin-right:.5em;border:1px solid rgb(213, 213, 213);
				background-color:#: tf.fieldTripGridDefinition.gridDefinition().stageFormatter(data.FieldTripStageId)#;float:left'></div><span>#:FieldTripStageName#</span>`
			},
			{
				FieldName: "Name",
				DisplayName: "Name",
				Width: "150px",
				type: "string",
			},
			{
				FieldName: "DepartFromSchool",
				DisplayName: "Depart From",
				Width: '150px',
				type: "string"
			},
			{
				FieldName: "ReturnDate",
				DisplayName: "Return Date",
				Width: '160px',
				type: "date"
			},
			{
				FieldName: "Destination",
				Width: '150px',
				type: "string",
				ListFilterTemplate: TF.ListFilterDefinition.ListFilterTemplate.DistinctListValue("FieldTripDestination", "fieldtrip", "Destination")
			},
			{
				FieldName: "DepartDate",
				DisplayName: "Departure Date",
				Width: '160px',
				type: "date"
			}
		]
	};

	ViewFieldTripViewModel.prototype._getSourceFromResponse = function(response)
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

	ViewFieldTripViewModel.prototype.afterInit = function()
	{
		// do not create clear all filter button
		this.leftSearchGrid.createFilterClearAll = function() { };
	};

	ViewFieldTripViewModel.prototype.apply = function()
	{
		return new Promise(function(resolve)
		{
			this.prepareData(this.selectedData).then(()=>resolve(this.selectedData));
		}.bind(this));
	};

	/**
	 * once data migrated, this function should be removed.
	 * @param {*} fieldTrips 
	 * @returns 
	 */
	ViewFieldTripViewModel.prototype.prepareData = function(fieldTrips)
	{
		const fieldTripIds = fieldTrips.map(x => x.Id);
		return tf.promiseAjax.get(pathCombine(tf.api.apiPrefix(),"fieldtripstops"),{
			paramData:{
				"@filter":`in(FieldTripId,${fieldTripIds.join(",")})`
			}
		}).then(function(response){
			const existingItems = response.Items,
				addingItems = [];

			 fieldTrips.filter(fieldTrip => fieldTrip.Id != 0).forEach(function(fieldTrip)
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
						StopTimeDepart: moment(fieldTrip.DepartDateTime).isValid() ? clientTimeZoneToUtc(fieldTrip.DepartDateTime).format("YYYY-MM-DDTHH:mm:ss") : null
					},
					terminalStop = {
						DBID: fieldTrip.DBID,
						FieldTripId: fieldTrip.Id,
						PrimaryDestination: true,
						Xcoord: fieldTrip.FieldTripDestinationXCoord,
						Ycoord: fieldTrip.FieldTripDestinationYCoord,
						FieldTripDestinationId: fieldTrip.FieldTripDestinationId,
						Street: fieldTrip.DestinationStreet || fieldTrip.Destination,
						Sequence: existingItems.filter(x => x.FieldTripId == fieldTrip.Id && !x.PrimaryDeparture && !x.PrimaryDestination).length + 2,
						StopTimeArrive: moment(fieldTrip.EstimatedReturnDateTime).isValid() ? clientTimeZoneToUtc(fieldTrip.EstimatedReturnDateTime).format("YYYY-MM-DDTHH:mm:ss") : null
					};

				if(!existingItems.find(x => x.FieldTripId == fieldTrip.Id && x.LockStopTime))
				{
					schoolStop.LockStopTime = true;
				}

				if(!existingItems.some(item => item.PrimaryDeparture && item.FieldTripId == fieldTrip.Id))
				{
					addingItems.push(schoolStop);
				}

				if(!existingItems.some(item => item.PrimaryDestination && item.FieldTripId == fieldTrip.Id))
				{
					addingItems.push(terminalStop);
				}
			});

			const p = [];
			if(addingItems.length)
			{
				p.push(tf.promiseAjax.post(pathCombine(tf.api.apiPrefix(),"fieldtripstops"), {data: addingItems}));
			}

			return Promise.all(p);
		});
	};

	ViewFieldTripViewModel.prototype.cancel = function()
	{
		TF.Control.KendoListMoverWithSearchControlViewModel.prototype.cancel.call(this);
		return new Promise(function(resolve)
		{
			resolve(true);
		});
	};

	ViewFieldTripViewModel.prototype.filterMenuClick = function(model, e)
	{
		this.createFilterMenu(model, e);
	};

	ViewFieldTripViewModel.prototype.getRequiredColumns = function()
	{
		return ['Id', 'FieldTripId', 'DBID', 'PublicId', 'FieldTripStageId', 'Name', 'School', 'SchoolName', 'SchoolXCoord', 'SchoolYCoord', 'FieldTripDestinationId', 'FieldTripDestinationXCoord', 'FieldTripDestinationYCoord', 'Destination', 'DestinationStreet', 'DepartDateTime', 'EstimatedReturnDateTime'];
	};

	ViewFieldTripViewModel.prototype.onBeforeLeftGridDataBound = function()
	{
	};

})();
