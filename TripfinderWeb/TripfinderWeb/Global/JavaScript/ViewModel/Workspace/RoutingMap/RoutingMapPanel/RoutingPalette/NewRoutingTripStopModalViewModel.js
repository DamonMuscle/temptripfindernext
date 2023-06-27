(function()
{
	createNamespace("TF.RoutingMap.RoutingPalette").NewRoutingTripStopModalViewModel = NewRoutingTripStopModalViewModel;

	function NewRoutingTripStopModalViewModel(points, trip, dataModel, isEdit)
	{
		TF.Modal.BaseModalViewModel.call(this);
		this.title(isEdit ? 'Edit Stop' : 'New Stop');
		this.sizeCss = "modal-dialog-sm";
		this.contentTemplate("workspace/RoutingMap/RoutingMapPanel/RoutingPalette/NewStops");
		this.buttonTemplate("modal/PositiveNegative");
		this.obPositiveButtonLabel("Apply");
		this.obNegativeButtonLabel("Cancel");
		this.viewModel = new TF.RoutingMap.RoutingPalette.NewRoutingTripStopViewModel(points, trip, dataModel, isEdit);
		this.data(this.viewModel);
	}

	NewRoutingTripStopModalViewModel.prototype = Object.create(TF.Modal.BaseModalViewModel.prototype);
	NewRoutingTripStopModalViewModel.prototype.constructor = NewRoutingTripStopModalViewModel;

	NewRoutingTripStopModalViewModel.prototype.positiveClick = function()
	{
		this.viewModel.apply().then(function(result)
		{
			if (result)
			{
				this.positiveClose(result);
			}
		}.bind(this));
	};

	NewRoutingTripStopModalViewModel.prototype.negativeClick = function()
	{
		var self = this;
		this.viewModel.cancel().then(function(result)
		{
			self.hide();
			self.resolve(false);
		});
	};

})();