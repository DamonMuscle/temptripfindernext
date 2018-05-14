(function()
{
	createNamespace("TF.Modal.Grid").ManageLayoutModalViewModel = ManageLayoutModalViewModel;

	function ManageLayoutModalViewModel(obGridLayoutExtendedDataModels, obGridFilterDataModels, fnSaveAndEditGridLayout, fnApplyGridLayout, obSelectedGridLayoutName)
	{
		TF.Modal.BaseModalViewModel.call(this);

		if (TF.isPhoneDevice)
		{
			this.modalClass = 'mobile-modal-grid-modal';
			this.sizeCss = "modal-fullscreen";
			this.contentTemplate('workspace/grid/ManageLayoutMobile');
			$("#pageMenu .show-menu-button").css('z-index', '1');
			this.manageLayoutViewModel = new TF.Grid.ManageLayoutViewMobileModel(obGridLayoutExtendedDataModels, obGridFilterDataModels, fnSaveAndEditGridLayout, fnApplyGridLayout, obSelectedGridLayoutName, this);
			this.data(this.manageLayoutViewModel);
		}
		else
		{
			this.sizeCss = "modal-dialog-lg";
			this.title('Manage Layouts');
			this.contentTemplate('workspace/grid/managelayout');
			this.buttonTemplate('modal/positive');
			this.obPositiveButtonLabel = ko.observable("Close");
			this.manageLayoutViewModel = new TF.Grid.ManageLayoutViewModel(obGridLayoutExtendedDataModels, obGridFilterDataModels, fnSaveAndEditGridLayout, fnApplyGridLayout, this.positiveClose);
			this.data(this.manageLayoutViewModel);
		}
	}

	ManageLayoutModalViewModel.prototype = Object.create(TF.Modal.BaseModalViewModel.prototype);
	ManageLayoutModalViewModel.prototype.constructor = ManageLayoutModalViewModel;

	ManageLayoutModalViewModel.prototype.dispose = function()
	{
		if (this.manageLayoutViewModel && this.manageLayoutViewModel.dispose)
		{
			this.manageLayoutViewModel.dispose();
		}

	};

})();
