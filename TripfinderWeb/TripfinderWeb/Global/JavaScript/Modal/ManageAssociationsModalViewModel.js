(function()
{
	createNamespace('TF.Modal').ManageAssociationsModalViewModel = ManageAssociationsModalViewModel;

	function ManageAssociationsModalViewModel(selectedData, option)
	{
		TF.Modal.BaseModalViewModel.call(this);
		this.contentTemplate('modal/manageassociationscontrol');
		this.buttonTemplate('modal/positivenegative');
		this.manageAssociationsViewModel = new TF.Control.ManageAssociationsViewModel(selectedData, option, this.shortCutKeyHashMapKeyName);
		this.data(this.manageAssociationsViewModel);
		this.sizeCss = 'modal-dialog-lg';
		this.obPositiveButtonLabel("Apply");
		this.title("Manage Document Associations");
	}

	ManageAssociationsModalViewModel.prototype = Object.create(TF.Modal.BaseModalViewModel.prototype);
	ManageAssociationsModalViewModel.prototype.constructor = ManageAssociationsModalViewModel;

	ManageAssociationsModalViewModel.prototype.positiveClick = function(viewModel, e)
	{
		this.manageAssociationsViewModel.apply().then(function(result)
		{
			if (result)
			{
				this.positiveClose(result);
			}
		}.bind(this));
	};

})();
