(function()
{
	createNamespace("TF.RoutingMap.RoutingPalette").SelectTripStopModalViewModel = SelectTripStopModalViewModel;

	function SelectTripStopModalViewModel(tripStops, type, isGeoLink)
	{
		TF.Modal.BaseModalViewModel.call(this);
		this.title(isGeoLink ? "GeoLink" : "Trip Stops");
		this.sizeCss = type == "stop" ? "modal-dialog-md" : "modal-dialog-sm";
		this.contentTemplate("workspace/Routing Map/RoutingMapPanel/RoutingPalette/SelectTripStopModal");
		this.buttonTemplate("modal/positivenegativeother");
		this.obPositiveButtonLabel("Apply");
		this.obNegativeButtonLabel("Cancel");
		this.obOtherButtonLabel("Select All Trip Stops");
		this.obDisableControl(true);
		this.viewModel = new TF.RoutingMap.RoutingPalette.SelectTripStopViewModel(tripStops, type, this.obDisableControl);
		this.data(this.viewModel);
	}

	SelectTripStopModalViewModel.prototype = Object.create(TF.Modal.BaseModalViewModel.prototype);
	SelectTripStopModalViewModel.prototype.constructor = SelectTripStopModalViewModel;

	SelectTripStopModalViewModel.prototype.positiveClick = function()
	{
		this.viewModel.apply().then(function(result)
		{
			if (result)
			{
				this.positiveClose(result);
			}
		}.bind(this));
	};

	SelectTripStopModalViewModel.prototype.otherClick = function()
	{
		this.viewModel.applyToAllClick().then(function(result)
		{
			this.positiveClose(result);
		}.bind(this));
	};

	SelectTripStopModalViewModel.prototype.negativeClick = function()
	{
		var self = this;
		this.viewModel.cancel().then(function(result)
		{
			if (result)
			{
				self.hide();
				self.resolve();
			}
		});
	};

})();