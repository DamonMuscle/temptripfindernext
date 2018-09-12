(function()
{
	createNamespace('TF.Modal').NewGridWithSelectedRecordsModalViewModel = NewGridWithSelectedRecordsModalViewModel;

	function NewGridWithSelectedRecordsModalViewModel(selectedIds, gridViewModel, kendoGrid)
	{
		TF.Modal.BaseModalViewModel.call(this);
		this.modalClass = 'mobile-modal-grid-modal';
		this.sizeCss = "modal-fullscreen";
		this.contentTemplate('modal/NewGridWithSelectedRecords');

		this.newGridWithSelectedRecordsViewModel = new TF.Control.NewGridWithSelectedRecordsViewModel(selectedIds, gridViewModel, kendoGrid, this);
    this.data(this.newGridWithSelectedRecordsViewModel);
	}

	NewGridWithSelectedRecordsModalViewModel.prototype = Object.create(TF.Modal.BaseModalViewModel.prototype);
	NewGridWithSelectedRecordsModalViewModel.prototype.constructor = NewGridWithSelectedRecordsModalViewModel;

	NewGridWithSelectedRecordsModalViewModel.prototype.negativeClick = function(e, viewmodel)
	{
		this.resetMenuLayer();
		return this.negativeClose();
	};

	NewGridWithSelectedRecordsModalViewModel.prototype.positiveClick = function(e, viewmodel)
	{
		this.resetMenuLayer();
		return this.negativeClick();
	};

	NewGridWithSelectedRecordsModalViewModel.prototype.resetMenuLayer = function()
	{
		$("#pageMenu .show-menu-button").css('z-index', '1999');
	};

})();
