(function()
{
	createNamespace("TF.RoutingMap.RoutingPalette").RoutingSearchModalViewModel = RoutingSearchModalViewModel;

	function RoutingSearchModalViewModel(map, option)
	{
		TF.Modal.BaseModalViewModel.call(this);
		this.title("Quick Add Stops");
		this.sizeCss = "modal-dialog";
		this.contentTemplate("workspace/RoutingMap/RoutingMapPanel/RoutingPalette/RoutingSearchModal");
		this.buttonTemplate("modal/PositiveNegative");
		this.obPositiveButtonLabel("Apply");
		this.obNegativeButtonLabel("Cancel");
		this.data(new TF.RoutingMap.RoutingPalette.RoutingSearchViewModel(map, option));

		setTimeout(() =>
		{
			tf.shortCutKeys.unbind("enter", Math.random().toString(36).substring(7));
		});
	}

	RoutingSearchModalViewModel.prototype = Object.create(TF.Modal.BaseModalViewModel.prototype);
	RoutingSearchModalViewModel.prototype.constructor = RoutingSearchModalViewModel;

	RoutingSearchModalViewModel.prototype.positiveClick = function()
	{
		this.data().apply().then(function(result)
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
		this.data().cancel().then(function(result)
		{
			if (result)
			{
				self.hide();
				self.resolve();
			}
		});
	};
})();