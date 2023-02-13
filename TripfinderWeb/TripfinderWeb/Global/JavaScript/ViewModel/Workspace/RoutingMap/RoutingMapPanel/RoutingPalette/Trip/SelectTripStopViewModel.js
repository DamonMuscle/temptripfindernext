(function()
{
	createNamespace("TF.RoutingMap.RoutingPalette").SelectTripStopViewModel = SelectTripStopViewModel;

	function SelectTripStopViewModel(tripStops, type, disableControl)
	{
		this.selectedRecords = [];
		this.tripStops = tripStops;
		this.type = type;
		this.obDisableControl = disableControl;
	}

	SelectTripStopViewModel.prototype.init = function(viewModel, element)
	{
		this.$element = $(element);
		this.initGrid();
	};

	SelectTripStopViewModel.prototype.initColumn = function()
	{
		var columns = [{
			title: "Trip",
			field: "tripName"
		}];
		if (this.type != "create")
		{
			columns.push({
				title: "Trip Stop",
				field: "name"
			})
		}
		if (this.type == "stop")
		{
			columns.push({
				title: "Assigned Students",
				field: "assignedFrom",
				template: "<div>#: assignedTo #(#: assignedFrom #)</div>",
			});
			columns.push({
				title: "Unassigned Students",
				field: "unassignedFrom",
				template: "<div>#: unassignedTo #(#: unassignedFrom #)</div>",
			});
		}
		return columns;
	};

	SelectTripStopViewModel.prototype.initGrid = function()
	{
		var self = this;
		self.selectedRecords = [];
		this.$element.find(".kendo-grid").kendoGrid({
			dataSource: new kendo.data.DataSource({
				data: this.tripStops.map(function(item)
				{
					return $.extend({}, item);
				}),
			}),
			columns: this.initColumn(),
			height: 400,
			selectable: "multiple",
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
			},
			change: function()
			{
				var selectedRows = this.select();
				self.selectedRecords = [];
				for (var i = 0; i < selectedRows.length; i++)
				{
					var dataItem = this.dataItem(selectedRows[i]);
					dataItem = self.getItemById(dataItem.id);
					self.selectedRecords.push(dataItem);
				}
				self.obDisableControl(self.selectedRecords.length === 0);
				self.setFooterDisplay();
			}
		});
		this.kendoGrid = this.$element.find(".kendo-grid").data("kendoGrid");
	};

	SelectTripStopViewModel.prototype.setFooterDisplay = function()
	{
		var name = TF.getSingularOrPluralTitle("Stops", this.tripStops.length);
		this.$element.find(".kendo-grid").find(".k-grid-pager").css("text-align", "left").html(String.format("{0} of {1} {2}", this.selectedRecords.length, this.tripStops.length, name));
	};

	SelectTripStopViewModel.prototype.getItemById = function(id)
	{
		return this.tripStops.filter(function(item)
		{
			return item.id == id;
		})[0];
	};

	SelectTripStopViewModel.prototype.apply = function()
	{
		var self = this;
		return Promise.resolve(self.selectedRecords);
	};

	SelectTripStopViewModel.prototype.applyToAllClick = function()
	{
		return Promise.resolve(this.tripStops);
	};

	SelectTripStopViewModel.prototype.cancel = function()
	{
		return Promise.resolve(true);
	};

})();