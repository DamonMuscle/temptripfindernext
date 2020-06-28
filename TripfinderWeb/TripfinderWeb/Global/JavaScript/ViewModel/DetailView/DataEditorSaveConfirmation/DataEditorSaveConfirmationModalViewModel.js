(function()
{
	createNamespace("TF.DetailView").DataEditorSaveConfirmationModalViewModel = DataEditorSaveConfirmationModalViewModel;

	function DataEditorSaveConfirmationModalViewModel(option)
	{
		var self = this;

		TF.Modal.BaseModalViewModel.call(self);

		self.sizeCss = "modal-dialog-md";
		self.modalClass = "dataeditorsaveconfirmation-modal";

		self.viewmodel = new TF.DetailView.DataEditorSaveConfirmationViewModel(option);
		self.data(self.viewmodel);

		self.title("Edit Confirmation");
		self.contentTemplate("Workspace/DetailView/DataEditorSaveConfirmationModal");
		self.buttonTemplate("modal/positivenegative");
		self.obPositiveButtonLabel("Save");

		// Allow disabling positive button in the view model.
		self.viewmodel.disablePositiveButton.subscribe(function()
		{
			self.obDisableControl(true);
		});
	}

	DataEditorSaveConfirmationModalViewModel.prototype = Object.create(TF.Modal.BaseModalViewModel.prototype);
	DataEditorSaveConfirmationModalViewModel.prototype.constructor = DataEditorSaveConfirmationModalViewModel;

	/**
	 * On positive button clicked.
	 *
	 * @param {Object} viewModel
	 * @param {Event} e
	 */
	DataEditorSaveConfirmationModalViewModel.prototype.positiveClick = function(viewModel, e)
	{
		this.positiveClose(true);
	};

	/**
	 * On negative button clicked.
	 *
	 * @param {Object} viewModel
	 * @param {Event} e
	 */
	DataEditorSaveConfirmationModalViewModel.prototype.negativeClick = function(viewModel, e)
	{
		this.negativeClose(false);
	};
})();