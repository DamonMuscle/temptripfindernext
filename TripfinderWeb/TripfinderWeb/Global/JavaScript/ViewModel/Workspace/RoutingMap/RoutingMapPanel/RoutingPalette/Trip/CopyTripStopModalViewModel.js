(function()
{
	createNamespace("TF.RoutingMap.RoutingPalette").CopyTripStopModalViewModel = CopyTripStopModalViewModel;

	function CopyTripStopModalViewModel(tripStop, dataModel)
	{
		TF.Modal.BaseModalViewModel.call(this);
		this.title("Copy Trip Stop");
		this.sizeCss = "modal-dialog";
		this.contentTemplate('workspace/Routing Map/RoutingMapPanel/RoutingPalette/CopyTripStop');
		this.buttonTemplate('modal/PositiveNegative');
		this.obPositiveButtonLabel("OK");
		this.obNegativeButtonLabel("Cancel");
		this.viewModel = new TF.RoutingMap.RoutingPalette.CopyTripStopViewModel(tripStop, dataModel);
		this.data(this.viewModel);
	}

	CopyTripStopModalViewModel.prototype = Object.create(TF.Modal.BaseModalViewModel.prototype);
	CopyTripStopModalViewModel.prototype.constructor = CopyTripStopModalViewModel;

	CopyTripStopModalViewModel.prototype.positiveClick = function()
	{
		this.viewModel.apply().then(function(result)
		{
			if (result)
			{
				this.positiveClose(result);
			}
		}.bind(this));
	};

	CopyTripStopModalViewModel.prototype.negativeClick = function()
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