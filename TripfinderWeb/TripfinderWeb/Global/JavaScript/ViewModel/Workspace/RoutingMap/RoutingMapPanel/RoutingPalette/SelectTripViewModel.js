(function()
{
	createNamespace("TF.RoutingMap.RoutingPalette").SelectTripViewModel = SelectTripViewModel;

	function SelectTripViewModel(trips, options, dataModel, obDisableControl)
	{
		this.selectedTrips = [];
		this.trips = trips;
		this.options = options;
		this.dataModel = dataModel;
		this.obDisableControl = obDisableControl;
	}

	SelectTripViewModel.prototype.init = function(viewModel, element)
	{
		this.$element = $(element);
		this.initGrid();
	};

	SelectTripViewModel.prototype.initGrid = function()
	{
		var self = this;
		self.vrpChangeSelect = false;
		self.selectedTrips = [];

		this.$element.find(".kendo-grid").kendoGrid({
			dataSource: new kendo.data.DataSource({
				data: this.trips.map(function(trip)
				{
					// fix trip stop geometry data will cause call stack error
					return $.extend({}, trip, { TripStops: [], extent: null });
				}),
				sort: { field: "Name", dir: "asc" },
			}),
			columns: [{
				title: "Trip Name",
				field: "Name",
				template: "<div><div style='height:20px;width:10px;float:left;margin-right:10px;background:#: color #;'></div>#: Name #</div>",
			}],
			height: 400,
			selectable: self.options.multiple ? "multiple" : "row",
			sortable: {
				mode: "single",
				allowUnsort: true
			},
			pageable: {
				pageSize: 5000,
				messages: {
					display: ""
				}
			},
			hideScrollNotOverflow: true,
			dataBinding: function()
			{
				self.setFooterDisplay();
				if (self.selectedTrips.length > 0)
				{
					setTimeout(() =>
					{
						var selected = this.items().filter((i, item) =>
						{
							var row = $(item).closest("tr");
							var dataItem = this.dataItem(row);
							return Enumerable.From(self.selectedTrips).Any(function(c) { return c.id == dataItem.id; });
						});

						this.clearSelection();
						this.select(selected);
					});
				}
			},
			change: function()
			{
				var selectedRows = this.select();
				if (self.options.isVrpClick)
				{
					self.changeVrpTripSelection(selectedRows);
				} else
				{
					self.selectedTrips = [];
					for (var i = 0; i < selectedRows.length; i++)
					{
						var dataItem = this.dataItem(selectedRows[i]);
						dataItem = self.getItemById(dataItem.id);
						self.selectedTrips.push(dataItem);
					}
				}
				self.obDisableControl(self.selectedTrips.length === 0);
				self.setFooterDisplay();
			}
		});
		this.kendoGrid = this.$element.find(".kendo-grid").data("kendoGrid");
	};

	SelectTripViewModel.prototype.changeVrpTripSelection = function(selectedRows)
	{
		var self = this, dataItem, i, row;

		if (self.vrpChangeSelect) return;
		if (selectedRows.length == 0) self.selectedTrips = [];
		if (selectedRows.length == 1)
		{
			dataItem = self.kendoGrid.dataItem(selectedRows[0]);
			dataItem = self.getItemById(dataItem.id);
			if (self.selectedTrips.length > 0)
			{
				if (self.isSameStopLocation(self.selectedTrips[0].TripStops[0], dataItem.TripStops[0]) &&
					self.isSameStopLocation(self.selectedTrips[0].TripStops[self.selectedTrips[0].TripStops.length - 1], dataItem.TripStops[dataItem.TripStops.length - 1]))
				{
					self.selectedTrips = [];
				}
			}
		}
		var rows = [];

		for (i = 0; i < selectedRows.length; i++)
		{
			dataItem = self.kendoGrid.dataItem(selectedRows[i]);
			if (!$(selectedRows[i]).hasClass("disSelectable"))
			{
				dataItem = self.getItemById(dataItem.id);
				self.selectedTrips.push(dataItem);
				rows.push($(selectedRows[i]));
			}

		}

		const $gridRows = self.$element.find(".k-grid-content table[role=grid] tr");
		self.selectedTrips = Enumerable.From(self.selectedTrips).Distinct(function(c) { return c.id; }).ToArray();
		for (i = 0; i < self.selectedTrips.length; i++)
		{
			for (var j = 0; j < $gridRows.length; j++)
			{
				row = $gridRows[j];
				dataItem = self.kendoGrid.dataItem(row);
				if (dataItem.id == self.selectedTrips[i].id)
				{
					rows.push($(row));
					break;
				}
			}
		}

		self.vrpChangeSelect = true;
		self.kendoGrid.clearSelection();
		self.kendoGrid.select(rows.map(c => c[0]));

		for (i = 0; i < $gridRows.length; i++)
		{
			row = $gridRows[i];
			var data = self.kendoGrid.dataItem(row);
			data = self.getItemById(data.id);
			if (self.selectedTrips[0] && (!self.isSameStopLocation(self.selectedTrips[0].TripStops[0], data.TripStops[0]) ||
				!self.isSameStopLocation(self.selectedTrips[0].TripStops[self.selectedTrips[0].TripStops.length - 1], data.TripStops[data.TripStops.length - 1])))
			{
				$(row).css("color", "lightgray");
				$(row).addClass("disSelectable");
			} else
			{
				$(row).css("color", "black");
				$(row).removeClass("disSelectable");
			}
		}
		self.vrpChangeSelect = false;
	};

	SelectTripViewModel.prototype.isSameStopLocation = function(stopa, stopb)
	{
		if (stopa.SchoolCode && stopa.SchoolCode.length > 0 && stopb.SchoolCode && stopb.SchoolCode.length > 0 && stopa.SchoolCode == stopb.SchoolCode) return true;
		if (stopa.geometry.x.toFixed(4) == stopb.geometry.x.toFixed(4)
			&& stopa.geometry.y.toFixed(4) == stopb.geometry.y.toFixed(4))
		{
			return true;
		}
		return false;
	};

	SelectTripViewModel.prototype.getItemById = function(id)
	{
		return this.trips.filter(function(trip)
		{
			return trip.id == id;
		})[0];
	};

	SelectTripViewModel.prototype.setFooterDisplay = function()
	{
		var name = TF.getSingularOrPluralTitle("Trips", this.trips.length);
		this.$element.find(".kendo-grid").find(".k-grid-pager").css("text-align", "left").html(String.format("{0} of {1} {2}", this.selectedTrips.length, this.trips.length, name));
	};

	SelectTripViewModel.prototype.apply = function()
	{
		if (this.options && (this.options.optionType == 'save' || this.options.optionType == 'close' || this.options.optionType == 'revert'))
		{
			var resultObject = this.dataModel.handleRelatedTrip(this.selectedTrips, this.options.optionType);
			if (resultObject.message)
			{
				return tf.promiseBootbox.confirm({
					message: resultObject.message,
					title: "Confirmation"
				}).then(function(result)
				{
					if (result)
					{
						return Promise.resolve(resultObject.trips);
					}
					else
					{
						return false;
					}
				});
			}
			else
			{
				return Promise.resolve(resultObject.trips);
			}
		}
		else if (this.options && this.options.optionType == 'unassign')
		{
			return this.dataModel.autoUnassignStudentConfirmation(this.selectedTrips);
		}
		else
		{
			return Promise.resolve(this.selectedTrips);
		}
	};

	SelectTripViewModel.prototype.applyToAllClick = function()
	{
		if (this.options && this.options.optionType == 'unassign')
		{
			return this.dataModel.autoUnassignStudentConfirmation(this.trips);
		}
		else
		{
			return Promise.resolve(this.trips);
		}

	};

	SelectTripViewModel.prototype.cancel = function()
	{
		return Promise.resolve(true);
	};

})();