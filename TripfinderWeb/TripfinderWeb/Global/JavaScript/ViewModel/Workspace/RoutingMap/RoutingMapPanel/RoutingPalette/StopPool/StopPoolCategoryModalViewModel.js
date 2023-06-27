(function()
{
	createNamespace("TF.RoutingMap.RoutingPalette").StopPoolCategoryModalViewModel = StopPoolCategoryModalViewModel;

	function StopPoolCategoryModalViewModel(data, eventType)
	{
		TF.Modal.BaseModalViewModel.call(this);
		this.eventType = eventType;
		var title = eventType.indexOf("new") >= 0 ? "New Stop Pool Category" : "Edit Stop Pool Category";
		this.title(title);
		this.sizeCss = "modal-dialog-sm";
		this.contentTemplate("workspace/RoutingMap/RoutingMapPanel/RoutingPalette/StopPoolCategoryModal");
		this.buttonTemplate("modal/positivenegative");
		this.viewModel = new TF.RoutingMap.RoutingPalette.StopPoolCategoryViewModel(data, eventType);
		this.data(this.viewModel);
	}

	StopPoolCategoryModalViewModel.prototype = Object.create(TF.Modal.BaseModalViewModel.prototype);
	StopPoolCategoryModalViewModel.prototype.constructor = StopPoolCategoryModalViewModel;

	StopPoolCategoryModalViewModel.prototype.positiveClick = function()
	{
		this.viewModel.apply().then(function(result)
		{
			if (result)
			{
				this.positiveClose(result);
			}
		}.bind(this));
	};

	StopPoolCategoryModalViewModel.prototype.negativeClick = function()
	{
		var self = this;
		this.viewModel.cancel().then(function(result)
		{
			self.hide();
			self.viewModel.pageLevelViewModel.obValidationErrors([]);
			self.resolve(result);
		});
	};
})();