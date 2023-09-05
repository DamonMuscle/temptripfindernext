(function()
{
	createNamespace("TF.Control").EditFieldTripTemplateInvoiceModalViewModel = EditFieldTripTemplateInvoiceModalViewModel;

	function EditFieldTripTemplateInvoiceModalViewModel(entity)
	{
		TF.Modal.BaseModalViewModel.call(this);
		this.sizeCss = "modal-dialog-sm";
		this.title(`${!!entity ? "Edit" : "Add"} Invoice Information`);
		this.contentTemplate('Workspace/Page/FieldTripConfigs/Modal/EditFieldTripTemplateInvoice');
		this.buttonTemplate('modal/positivenegative');
		this.viewModel = new TF.Control.EditFieldTripTemplateInvoiceViewModel(entity);
		this.data(this.viewModel);
	}

	EditFieldTripTemplateInvoiceModalViewModel.prototype = Object.create(TF.Modal.BaseModalViewModel.prototype);

	EditFieldTripTemplateInvoiceModalViewModel.prototype.constructor = EditFieldTripTemplateInvoiceModalViewModel;

	EditFieldTripTemplateInvoiceModalViewModel.prototype.positiveClick = function(viewModel, e)
	{
		let self = this;
		self.viewModel.apply().then(function(result)
		{
			if (result)
			{
				self.positiveClose(result);
			}
		});
	};
})();