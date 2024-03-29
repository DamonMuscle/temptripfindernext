// select a field trip to display in the map (editable) through this dialog
(function()
{
	createNamespace("TF.RoutingMap.RoutingPalette").OpenFieldTripModalViewModel = OpenFieldTripModalViewModel;

	function OpenFieldTripModalViewModel(selectedData, options)
	{
		selectedData = selectedData.slice();
		$.extend(options, {
			title: "Edit Field Trips",
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
			type: "fieldtrip",
			GridType:"FieldTrip",
			additionalFilterItems: [{ FieldName: "SchoolGeocoded", Operator: "EqualTo", Value: "True"},
				{ FieldName: "FieldTripDestinationGeocoded", Operator: "EqualTo", Value: "True" }],
			getUrl: function()
			{
				return pathCombine(tf.api.apiPrefix(), "search", tf.dataTypeHelper.getEndpoint("fieldtrip"));
			},
			serverPaging: false
		});
		TF.Modal.KendoListMoverWithSearchControlModalViewModel.call(this, selectedData, options);
		this.obDisableControl(true);
		this.ListMoverSelectTripViewModel = new TF.RoutingMap.RoutingPalette.OpenFieldTripViewModel(selectedData, options, this.obDisableControl);
		this.data(this.ListMoverSelectTripViewModel);
		this.obEnableEnter(false);
		this.obResizable(true);
	}

	OpenFieldTripModalViewModel.prototype = Object.create(TF.Modal.KendoListMoverWithSearchControlModalViewModel.prototype);
	OpenFieldTripModalViewModel.prototype.constructor = OpenFieldTripModalViewModel;

	OpenFieldTripModalViewModel.prototype.positiveClick = function()
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

	OpenFieldTripModalViewModel.prototype.negativeClick = function()
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
