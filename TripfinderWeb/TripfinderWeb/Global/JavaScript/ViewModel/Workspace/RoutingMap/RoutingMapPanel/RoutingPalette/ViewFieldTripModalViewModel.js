(function()
{
	createNamespace("TF.RoutingMap.RoutingPalette").ViewFieldTripModalViewModel = ViewFieldTripModalViewModel;

	function ViewFieldTripModalViewModel(selectedData, unavailableData)
	{
		selectedData = selectedData.slice();
		var options = {
			title: "View Field Trips",
			description: "",
			mustSelect: false,
			disableDropIndicator: true,
			gridOptions: {
				forceFitColumns: true,
				enableColumnReorder: true
			},
			showRemoveColumnButton: true,
			displayCheckbox: true,
			type: "fieldtrip",
			GridType: "FieldTrip",
			getUrl: function()
			{
				return pathCombine(tf.api.apiPrefix(), "search", tf.dataTypeHelper.getEndpoint("fieldtrip"));
			}
		};

		TF.Modal.KendoListMoverWithSearchControlModalViewModel.call(this, selectedData, options);
		this.obDisableControl(true);
		this.ListMoverSelectTripViewModel = new TF.RoutingMap.RoutingPalette.ViewFieldTripViewModel(selectedData, options, unavailableData, this.obDisableControl);
		this.data(this.ListMoverSelectTripViewModel);
	}

	ViewFieldTripModalViewModel.prototype = Object.create(TF.Modal.KendoListMoverWithSearchControlModalViewModel.prototype);
	ViewFieldTripModalViewModel.prototype.constructor = ViewFieldTripModalViewModel;

	ViewFieldTripModalViewModel.prototype.positiveClick = function()
	{
		this.ListMoverSelectTripViewModel.apply().then(function(result)
		{
			if (result)
			{
				this.positiveClose(result);
			}
		}.bind(this));
	};

	ViewFieldTripModalViewModel.prototype.negativeClick = function()
	{
		this.ListMoverSelectTripViewModel.cancel().then(function(result)
		{
			if (result)
			{
				this.negativeClose(false);
			}
		}.bind(this));
	};
})();
