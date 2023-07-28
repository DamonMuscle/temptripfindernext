/**
 * clicking 'New Copy' in field trip level will invoke this module
 */
(function()
{
	createNamespace("TF.RoutingMap.RoutingPalette").CopyFieldTripModalViewModel = CopyFieldTripModalViewModel;

	function CopyFieldTripModalViewModel(trip, dataModel)
	{
		TF.Modal.BaseModalViewModel.call(this);
		this.title("Copy Field Trip");
		this.sizeCss = "modal-dialog";
		this.modalClass = "copy-trip-body";
		this.contentTemplate('workspace/RoutingMap/RoutingMapPanel/RoutingPalette/CopyFieldTrip');
		this.buttonTemplate('modal/PositiveNegative');
		this.obPositiveButtonLabel("OK");
		this.obNegativeButtonLabel("Cancel");
		this.viewModel = new TF.RoutingMap.RoutingPalette.CopyFieldTripViewModel(trip, dataModel);
		this.data(this.viewModel);
	};

	CopyFieldTripModalViewModel.prototype = Object.create(TF.Modal.BaseModalViewModel.prototype);
	CopyFieldTripModalViewModel.prototype.constructor = CopyFieldTripModalViewModel;

	CopyFieldTripModalViewModel.prototype.positiveClick = function(viewModel, e)
	{
		this.viewModel.apply().then(function(result)
		{
			if (result)
			{
				this.positiveClose(result);
			}
		}.bind(this));
	};

	CopyFieldTripModalViewModel.prototype.negativeClick = function()
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