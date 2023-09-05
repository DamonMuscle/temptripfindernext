(function()
{
	createNamespace("TF.Control").EditFieldTripTemplateDocumentModalViewModel = EditFieldTripTemplateDocumentModalViewModel;

	function EditFieldTripTemplateDocumentModalViewModel(entity, classificationList)
	{
		TF.Modal.BaseModalViewModel.call(this);
		this.sizeCss = "modal-dialog-sm";
		this.title(`${!!entity ? "Edit" : "Add"} Documents`);
		this.contentTemplate('Workspace/Page/FieldTripConfigs/Modal/EditFieldTripTemplateDocument');
		this.buttonTemplate('modal/positivenegative');
		this.viewModel = new TF.Control.EditFieldTripTemplateDocumentViewModel(entity, classificationList);
		this.data(this.viewModel);
	}

	EditFieldTripTemplateDocumentModalViewModel.prototype = Object.create(TF.Modal.BaseModalViewModel.prototype);

	EditFieldTripTemplateDocumentModalViewModel.prototype.constructor = EditFieldTripTemplateDocumentModalViewModel;

	EditFieldTripTemplateDocumentModalViewModel.prototype.positiveClick = function(viewModel, e)
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