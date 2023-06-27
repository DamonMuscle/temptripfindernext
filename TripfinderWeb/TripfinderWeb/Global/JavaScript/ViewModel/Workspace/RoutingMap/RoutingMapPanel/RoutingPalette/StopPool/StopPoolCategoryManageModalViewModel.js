(function()
{
	createNamespace("TF.RoutingMap.RoutingPalette").StopPoolCategoryManageModalViewModel = StopPoolCategoryManageModalViewModel;

	function StopPoolCategoryManageModalViewModel(viewModel)
	{
		TF.Modal.BaseModalViewModel.call(this);
		this.title("Manage Stop Pool Category");
		this.sizeCss = "message-modal-dialog";
		this.buttonTemplate("modal/positivenegative");
		this.obPositiveButtonLabel("Open");
		this.obNegativeButtonLabel("Close");
		this.obDisableControl(true);
		this.contentTemplate("workspace/RoutingMap/RoutingMapPanel/RoutingPalette/StopPoolCategoryManageModal");
		this.viewModel = new TF.RoutingMap.RoutingPalette.StopPoolCategoryManageViewModel(this, viewModel);
		this.data(this.viewModel);
	}

	StopPoolCategoryManageModalViewModel.prototype = Object.create(TF.Modal.BaseModalViewModel.prototype);
	StopPoolCategoryManageModalViewModel.prototype.constructor = StopPoolCategoryManageModalViewModel;

	StopPoolCategoryManageModalViewModel.prototype.positiveClick = function()
	{
		this.viewModel.apply().then(function(result)
		{
			if (result)
			{
				this.positiveClose(result);
			}
		}.bind(this));
	};
})();