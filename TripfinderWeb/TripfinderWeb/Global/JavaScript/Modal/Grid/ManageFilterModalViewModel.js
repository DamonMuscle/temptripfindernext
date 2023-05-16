(function()
{
	createNamespace("TF.Modal.Grid").ManageFilterModalViewModel = ManageFilterModalViewModel;

	function ManageFilterModalViewModel(options)
	{
		TF.Modal.BaseModalViewModel.call(this);

		if (TF.isPhoneDevice)
		{
			this.modalClass = 'mobile-modal-grid-modal';
			this.sizeCss = 'modal-fullscreen';
			this.contentTemplate('workspace/grid/ManageFilterMobile');
			$('#pageMenu .show-menu-button').css('z-index', '1');
			this.manageFilterViewModel = new TF.Grid.ManageFilterViewMobileModel({
				negativeClick: this.negativeClick.bind(this),
				...options
			});
			this.data(this.manageFilterViewModel);
		}
		else
		{
			this.sizeCss = "modal-dialog-lg";
			this.title('Manage Filters');
			this.contentTemplate('workspace/grid/managefilter');
			this.buttonTemplate('modal/positive');
			this.obPositiveButtonLabel = ko.observable("Close");
			this.manageFilterViewModel = new TF.Grid.ManageFilterViewModel({
				positiveClose: this.positiveClose,
				...options
			});
			this.data(this.manageFilterViewModel);
		}
	};

	ManageFilterModalViewModel.prototype = Object.create(TF.Modal.BaseModalViewModel.prototype);
	ManageFilterModalViewModel.prototype.constructor = ManageFilterModalViewModel;
})();
