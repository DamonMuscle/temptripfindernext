(function()
{
	createNamespace("TF.RoutingMap.RoutingPalette").OptimizeSequenceModalViewModel = OptimizeSequenceModalViewModel;

	function OptimizeSequenceModalViewModel(oldTrip, newTrip, dataModel)
	{
		TF.Modal.BaseModalViewModel.call(this);
		this.title('Trip Sequence Optimization Impact');
		this.sizeCss = "optimize-sequence-model";
		this.contentTemplate("workspace/Routing Map/RoutingMapPanel/RoutingPalette/OptimizeSequenceModal");
		this.buttonTemplate("modal/positivenegativeother");
		this.obPositiveButtonLabel("Apply");
		this.obNegativeButtonLabel("Cancel");
		this.obOtherButtonLabel("Save as New Trip");
		this.viewModel = new TF.RoutingMap.RoutingPalette.OptimizeSequenceViewModel(this, oldTrip, newTrip, dataModel);
		this.data(this.viewModel);
	}

	OptimizeSequenceModalViewModel.prototype = Object.create(TF.Modal.BaseModalViewModel.prototype);
	OptimizeSequenceModalViewModel.prototype.constructor = OptimizeSequenceModalViewModel;

	OptimizeSequenceModalViewModel.prototype.positiveClick = function()
	{
		this.viewModel.apply().then(function(result)
		{
			this.positiveClose(result);
		}.bind(this));
	};

	OptimizeSequenceModalViewModel.prototype.otherClick = function(viewModel, e)
	{
		this.viewModel.saveAsNewClick().then(function(result)
		{
			this.positiveClose(result);
		}.bind(this));
	};

	OptimizeSequenceModalViewModel.prototype.negativeClick = function()
	{
		var self = this;
		this.viewModel.cancel().then(function(result)
		{
			self.hide();
			self.resolve(false);
		});
	};

})();