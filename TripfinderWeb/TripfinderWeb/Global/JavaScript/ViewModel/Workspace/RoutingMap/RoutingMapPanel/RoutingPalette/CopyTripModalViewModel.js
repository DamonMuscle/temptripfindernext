(function()
{
	createNamespace("TF.RoutingMap.RoutingPalette").CopyTripModalViewModel = CopyTripModalViewModel;

	function CopyTripModalViewModel(trip, dataModel)
	{
		TF.Modal.BaseModalViewModel.call(this);
		this.title("Copy Trip");
		this.sizeCss = "modal-dialog";
		this.modalClass = "copy-trip-body";
		this.contentTemplate('workspace/RoutingMap/RoutingMapPanel/RoutingPalette/CopyTrip');
		this.buttonTemplate('modal/PositiveNegative');
		this.obPositiveButtonLabel("OK");
		this.obNegativeButtonLabel("Cancel");
		this.viewModel = new TF.RoutingMap.RoutingPalette.CopyTripViewModel(trip, dataModel);
		this.data(this.viewModel);
	};

	CopyTripModalViewModel.prototype = Object.create(TF.Modal.BaseModalViewModel.prototype);
	CopyTripModalViewModel.prototype.constructor = CopyTripModalViewModel;

	CopyTripModalViewModel.prototype.positiveClick = function(viewModel, e)
	{
		this.viewModel.apply().then(function(result)
		{
			if (result)
			{
				this.positiveClose(result);
			}
		}.bind(this));
	};

	CopyTripModalViewModel.prototype.negativeClick = function()
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
	}

})();