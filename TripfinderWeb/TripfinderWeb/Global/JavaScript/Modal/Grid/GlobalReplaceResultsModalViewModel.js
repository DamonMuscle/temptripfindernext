(function()
{
	createNamespace("TF.Modal.Grid").GlobalReplaceResultsModalViewModel = GlobalReplaceResultsModalViewModel;

	function GlobalReplaceResultsModalViewModel(resultsInfo, gridType)
	{
		var self = this;
		TF.Modal.BaseModalViewModel.call(self);
		self.sizeCss = "modal-dialog-sm";
		self.title("Mass Update Results");
		self.contentTemplate("Modal/GlobalReplaceResults");
		self.buttonTemplate("modal/positive");
		self.obPositiveButtonLabel("Close");
		self.model = new TF.Control.GlobalReplaceResultsViewModel(resultsInfo, gridType);
		self.data(self.model);
	}

	GlobalReplaceResultsModalViewModel.prototype = Object.create(TF.Modal.BaseModalViewModel.prototype);
	GlobalReplaceResultsModalViewModel.prototype.constructor = GlobalReplaceResultsModalViewModel;

})();