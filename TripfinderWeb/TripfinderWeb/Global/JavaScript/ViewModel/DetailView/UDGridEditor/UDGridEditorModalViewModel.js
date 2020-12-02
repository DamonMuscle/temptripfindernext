(function()
{
	createNamespace("TF.DetailView").UDGriditorModalViewModel = UDGriditorModalViewModel;
	function UDGriditorModalViewModel(UDGrid, recordEntity)
	{
		var self = this;

		TF.Modal.BaseModalViewModel.call(self);

		self.sizeCss = "modal-dialog-md";

		self.viewmodel = new TF.DetailView.UDGridEditorViewModel(UDGrid, recordEntity);
		self.data(self.viewmodel);

		self.title("UDGrid Add/Edit");
		self.contentTemplate("Workspace/DetailView/UDGridEditor");
		self.buttonTemplate("modal/positivenegative");
		self.obPositiveButtonLabel("Save");

		// // Allow disabling positive button in the view model.
		// self.viewmodel.disablePositiveButton.subscribe(function()
		// {
		// 	self.obDisableControl(true);
		// });
	}

	UDGriditorModalViewModel.prototype = Object.create(TF.Modal.BaseModalViewModel.prototype);
	UDGriditorModalViewModel.prototype.constructor = UDGriditorModalViewModel;
	UDGriditorModalViewModel.prototype.negativeClick = function()
	{
		this.negativeClose(false);
	};
	UDGriditorModalViewModel.prototype.dispose = function()
	{
		this.data().dispose();
	};
}
)()