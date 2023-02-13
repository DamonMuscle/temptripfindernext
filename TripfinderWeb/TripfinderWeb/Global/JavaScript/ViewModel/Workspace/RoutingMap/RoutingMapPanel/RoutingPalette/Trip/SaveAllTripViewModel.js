(function()
{
	createNamespace("TF.RoutingMap.RoutingPalette").SaveAllTripViewModel = SaveAllTripViewModel;

	function SaveAllTripViewModel(trips, changeType)
	{
		this.trips = trips;
		this.changeType = changeType;
	}

	SaveAllTripViewModel.prototype.init = function(viewModel, element)
	{
		this.$element = $(element);
		this.initGrid();
	};

	SaveAllTripViewModel.prototype.initColumn = function()
	{
		var columns = [{
			title: "Trip",
			field: "Name"
		}];

		if (this.changeType == 'requirement')
		{
			columns = [{
				title: "Trip Name",
				field: "TripName"
			}, {
				title: "Trip Stop Name",
				field: "StopName"
			}, {
				title: "Operating",
				field: "ChangeType"
			}];
		}

		return columns;
	};

	SaveAllTripViewModel.prototype.initData = function()
	{
		var data = this.trips.map(function(item)
		{
			return { Name: item.Name, ChangeType: item.ChangeType }
		});
		if (this.changeType == 'requirement')
		{
			data = this.trips.map(function(item)
			{
				return { TripName: item.TripName, ChangeType: item.ChangeType, StopName: item.StopName }
			});
		}

		return data;
	}

	SaveAllTripViewModel.prototype.initGrid = function()
	{
		var self = this;
		this.$element.find(".kendo-grid").kendoGrid({
			dataSource: new kendo.data.DataSource({
				data: self.initData(),
			}),
			columns: this.initColumn(),
			height: 400,
			selectable: false,
			sortable: false,
			pageable: false,
			hideScrollNotOverflow: true,
		});
		this.kendoGrid = this.$element.find(".kendo-grid").data("kendoGrid");
	};

	SaveAllTripViewModel.prototype.apply = function()
	{
		var self = this;
		return Promise.resolve(self.trips);
	};

	SaveAllTripViewModel.prototype.cancel = function()
	{
		return Promise.resolve(true);
	};

})();