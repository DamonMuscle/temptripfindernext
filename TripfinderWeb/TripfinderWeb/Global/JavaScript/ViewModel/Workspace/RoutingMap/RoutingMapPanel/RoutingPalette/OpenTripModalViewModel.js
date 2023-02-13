(function()
{
	createNamespace("TF.RoutingMap.RoutingPalette").OpenTripModalViewModel = OpenTripModalViewModel;

	function OpenTripModalViewModel(selectedData, options)
	{
		selectedData = selectedData.slice();
		$.extend(options, {
			title: "Edit Trips",
			description: "",
			mustSelect: false,
			disableDropIndicator: true,
			gridOptions: {
				forceFitColumns: true,
				enableColumnReorder: true
			},
			queryBySelectedColumns: true,
			showRemoveColumnButton: true,
			displayCheckbox: true,
			type: "trip",
			getUrl: function()
			{
				return pathCombine(tf.api.apiPrefix(), "search", tf.dataTypeHelper.getEndpoint("trip"));
			}
		});
		TF.Modal.KendoListMoverWithSearchControlModalViewModel.call(this, selectedData, options);
		this.obDisableControl(true);
		this.ListMoverSelectTripViewModel = new TF.RoutingMap.RoutingPalette.OpenTripViewModel(selectedData, options, this.obDisableControl);
		this.data(this.ListMoverSelectTripViewModel);
		this.obEnableEnter(false);
		this.obResizable(true);
	}

	OpenTripModalViewModel.prototype = Object.create(TF.Modal.KendoListMoverWithSearchControlModalViewModel.prototype);
	OpenTripModalViewModel.prototype.constructor = OpenTripModalViewModel;

	OpenTripModalViewModel.prototype.positiveClick = function()
	{
		this.ListMoverSelectTripViewModel.apply().then(function(result)
		{
			if (result)
			{
				this.positiveClose(result);
				tfdispose(this.ListMoverSelectTripViewModel);
			}
		}.bind(this));
	};

	OpenTripModalViewModel.prototype.negativeClick = function()
	{
		this.ListMoverSelectTripViewModel.cancel().then(function(result)
		{
			if (result)
			{
				this.negativeClose(false);
				tfdispose(this.ListMoverSelectTripViewModel);
			}
		}.bind(this));
	};
})();
