(function()
{
	createNamespace("TF.RoutingMap.RoutingPalette").RoutingSearchModalViewModel = RoutingSearchModalViewModel;

	function RoutingSearchModalViewModel(map, option)
	{
		TF.Modal.BaseModalViewModel.call(this);
		this.title("Quick Add Stops");
		this.sizeCss = "modal-dialog";
		this.contentTemplate("workspace/Routing Map/RoutingMapPanel/RoutingPalette/RoutingSearchModal");
		this.buttonTemplate("modal/PositiveNegative");
		this.obPositiveButtonLabel("Apply");
		this.obNegativeButtonLabel("Cancel");
		this.viewModel = new TF.RoutingMap.RoutingPalette.RoutingSearchViewModel(map, option);
		this.data(this.viewModel);

		setTimeout(() =>
		{
			tf.shortCutKeys.unbind("enter", Math.random().toString(36).substring(7));
		});
	}

	RoutingSearchModalViewModel.prototype = Object.create(TF.Modal.BaseModalViewModel.prototype);
	RoutingSearchModalViewModel.prototype.constructor = RoutingSearchModalViewModel;

	RoutingSearchModalViewModel.prototype.positiveClick = function()
	{
		this.viewModel.apply().then(function(result)
		{
			if (result)
			{
				this.positiveClose(result);
			}
		}.bind(this));
	};

	RoutingSearchModalViewModel.prototype.negativeClick = function()
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