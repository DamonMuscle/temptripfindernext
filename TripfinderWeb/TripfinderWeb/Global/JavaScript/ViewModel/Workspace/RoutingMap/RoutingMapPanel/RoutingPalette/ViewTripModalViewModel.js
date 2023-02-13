(function()
{
	createNamespace("TF.RoutingMap.RoutingPalette").ViewTripModalViewModel = ViewTripModalViewModel;

	function ViewTripModalViewModel(selectedData, unavailableData)
	{
		selectedData = selectedData.slice();
		var options = {
			title: "View Trips",
			description: "",
			mustSelect: false,
			disableDropIndicator: true,
			gridOptions: {
				forceFitColumns: true,
				enableColumnReorder: true
			},
			showRemoveColumnButton: true,
			displayCheckbox: true,
			type: "trip",
			getUrl: function()
			{
				return pathCombine(tf.api.apiPrefix(), "search", tf.dataTypeHelper.getEndpoint("trip"));
			}
		};

		TF.Modal.KendoListMoverWithSearchControlModalViewModel.call(this, selectedData, options);
		this.obDisableControl(true);
		this.ListMoverSelectTripViewModel = new TF.RoutingMap.RoutingPalette.ViewTripViewModel(selectedData, options, unavailableData, this.obDisableControl);
		this.data(this.ListMoverSelectTripViewModel);
	}

	ViewTripModalViewModel.prototype = Object.create(TF.Modal.KendoListMoverWithSearchControlModalViewModel.prototype);
	ViewTripModalViewModel.prototype.constructor = ViewTripModalViewModel;

	ViewTripModalViewModel.prototype.positiveClick = function()
	{
		this.ListMoverSelectTripViewModel.apply().then(function(result)
		{
			if (result)
			{
				this.positiveClose(result);
			}
		}.bind(this));
	};

	ViewTripModalViewModel.prototype.negativeClick = function()
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
