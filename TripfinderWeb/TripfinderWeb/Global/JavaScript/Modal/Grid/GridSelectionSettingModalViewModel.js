(function()
{
	createNamespace("TF.Modal.Grid").GridSelectionSettingModalViewModel = GridSelectionSettingModalViewModel;

	function GridSelectionSettingModalViewModel(selectedCount, title)
	{
		var self = this;
		TF.Modal.BaseModalViewModel.call(self);

		self.sizeCss = "modal-dialog-sm";
		self.title(title);
		self.contentTemplate("Modal/GridSelectionSetting");
		self.buttonTemplate("modal/positivenegative");
		self.obPositiveButtonLabel("Apply");
		self.obNegativeButtonLabel("Close");

		self.model = new TF.Control.GridSelectionSettingViewModel(selectedCount);
		self.data(self.model);
	}

	GridSelectionSettingModalViewModel.prototype = Object.create(TF.Modal.BaseModalViewModel.prototype);
	GridSelectionSettingModalViewModel.prototype.constructor = GridSelectionSettingModalViewModel;

	GridSelectionSettingModalViewModel.prototype.positiveClick = function()
	{
		var self = this;
		var result = self.model.apply();
		self.positiveClose(result);
	};

})();