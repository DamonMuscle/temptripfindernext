(function()
{
	createNamespace("TF.RoutingMap.RoutingPalette").ViewFieldTripViewModel = ViewFieldTripViewModel;

	function ViewFieldTripViewModel(selectedData, options, unavailableData, disableControl)
	{
		// options.getSelectableRecords = this._getSelectableRecords.bind(this);
		this.unavailableData = unavailableData;
		TF.Control.KendoListMoverWithSearchControlViewModel.call(this, selectedData, options);
		this.obDisableControl = disableControl;
	}

	ViewFieldTripViewModel.prototype = Object.create(TF.Control.KendoListMoverWithSearchControlViewModel.prototype);
	ViewFieldTripViewModel.prototype.constructor = ViewFieldTripViewModel;

	ViewFieldTripViewModel.prototype.columnSources = {
		fieldtrip: [
			{
				FieldName: "Name",
				DisplayName: "Name",
				Width: "150px",
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
						Sequence: existingItems.filter(x => x.FieldTripId == fieldTrip.Id && !x.PrimaryDeparture && !x.PrimaryDestination).length + 2,
					};

				if(!existingItems.find(x => x.FieldTripId == fieldTrip.Id && x.LockStopTime))
				{
					schoolStop.LockStopTime = true;
				}

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

	ViewFieldTripViewModel.prototype.cancel = function()
	{
		return new Promise(function(resolve)
		{
			resolve(true);
		});
	};

	ViewFieldTripViewModel.prototype.filterMenuClick = function()
	{
	};

	ViewFieldTripViewModel.prototype.onBeforeLeftGridDataBound = function()
	{
	};

})();
