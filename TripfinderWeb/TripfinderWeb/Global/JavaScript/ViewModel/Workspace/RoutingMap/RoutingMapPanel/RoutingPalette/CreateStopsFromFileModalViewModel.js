(function()
{
	createNamespace("TF.RoutingMap.RoutingPalette").CreateStopsFromFileModalViewModel = CreateStopsFromFileModalViewModel;

	function CreateStopsFromFileModalViewModel(tripStops, viewModel)
	{
		TF.Modal.BaseModalViewModel.call(this);
		this.title("Create Stops From File");
		this.sizeCss = "modal-dialog";
		this.contentTemplate('workspace/RoutingMap/RoutingMapPanel/RoutingPalette/CreateStopsFromFile');
		this.buttonTemplate('modal/PositiveNegative');
		this.obPositiveButtonLabel("OK");
		this.obNegativeButtonLabel("Cancel");
		this.viewModel = new TF.RoutingMap.RoutingPalette.CreateStopsFromFileViewModel(tripStops, viewModel);
		this.data(this.viewModel);
		this.obResizable(true);
	}

	CreateStopsFromFileModalViewModel.prototype = Object.create(TF.Modal.BaseModalViewModel.prototype);
	CreateStopsFromFileModalViewModel.prototype.constructor = CreateStopsFromFileModalViewModel;

	CreateStopsFromFileModalViewModel.prototype.positiveClick = function(viewModel, e)
	{
		this.viewModel.apply().then(function(result)
		{
			if (result)
			{
				this.positiveClose(result);
			}
		}.bind(this));
	};

	CreateStopsFromFileModalViewModel.prototype.negativeClick = function()
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