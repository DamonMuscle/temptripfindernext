(function()
{
	createNamespace("TF.RoutingMap.TravelScenariosPalette").TravelScenarioManageModalViewModel = TravelScenarioManageModalViewModel;

	function TravelScenarioManageModalViewModel(scenarioViewModel)
	{
		TF.Modal.BaseModalViewModel.call(this);
		this.title('Manage Travel Scenarios');
		this.sizeCss = "message-modal-dialog";
		this.buttonTemplate('modal/positivenegative');
		this.obPositiveButtonLabel("Open");
		this.obNegativeButtonLabel("Close");
		this.obDisableControl(true);
		this.contentTemplate('workspace/RoutingMap/RoutingMapPanel/TravelScenariosPalette/TravelScenarioManageModal');
		this.viewModel = new TF.RoutingMap.TravelScenariosPalette.TravelScenarioManageViewModel(this, scenarioViewModel);
		this.data(this.viewModel);
	};

	TravelScenarioManageModalViewModel.prototype = Object.create(TF.Modal.BaseModalViewModel.prototype);
	TravelScenarioManageModalViewModel.prototype.constructor = TravelScenarioManageModalViewModel;

	TravelScenarioManageModalViewModel.prototype.positiveClick = function(viewModel, e)
	{
		this.viewModel.apply().then(function(result)
		{
			if (result)
			{
				this.positiveClose(result);
			}
		}.bind(this))
	};
})();