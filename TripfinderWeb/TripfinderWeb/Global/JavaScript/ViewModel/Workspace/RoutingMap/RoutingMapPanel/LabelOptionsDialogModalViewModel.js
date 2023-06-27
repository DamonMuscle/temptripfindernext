(function()
{
	createNamespace("TF.RoutingMap").LabelOptionsDialogModalViewModel = LabelOptionsDialogModalViewModel;

	function LabelOptionsDialogModalViewModel(panelType, routeState, defaultLabelOptionsData, currentZoomLevel, title, options, notSaving, useUserPerference)
	{
		TF.Modal.BaseModalViewModel.call(this);
		this.title(title + " Label Options");
		this.sizeCss = "label-options-dialog";
		this.contentTemplate('workspace/RoutingMap/RoutingMapPanel/LabelOptionsDialog');
		this.buttonTemplate('modal/PositiveNegative');
		this.obPositiveButtonLabel("Save");
		this.obNegativeButtonLabel("Cancel");
		this.viewModel = new TF.RoutingMap.LabelOptionsDialogViewModel(panelType, routeState, defaultLabelOptionsData, currentZoomLevel, options, notSaving, useUserPerference);
		this.data(this.viewModel);
	};

	LabelOptionsDialogModalViewModel.prototype = Object.create(TF.Modal.BaseModalViewModel.prototype);
	LabelOptionsDialogModalViewModel.prototype.constructor = LabelOptionsDialogModalViewModel;

	LabelOptionsDialogModalViewModel.prototype.positiveClick = function(viewModel, e)
	{
		this.viewModel.apply().then(function(result)
		{
			this.positiveClose(result);
		}.bind(this));
	};

	LabelOptionsDialogModalViewModel.prototype.closeClick = function(viewModel, e)
	{
		this.viewModel.closeColorPicker();
		TF.Modal.BaseModalViewModel.prototype.closeClick.call(this, viewModel, e);
	};

	LabelOptionsDialogModalViewModel.prototype.negativeClick = function()
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