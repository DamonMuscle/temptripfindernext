(function()
{
	createNamespace('TF.Modal').KendoListMoverWithSearchControlModalViewModel = KendoListMoverWithSearchControlModalViewModel;

	function KendoListMoverWithSearchControlModalViewModel(selectedData, options)
	{
		TF.Modal.BaseModalViewModel.call(this);
		this.sizeCss = 'modal-dialog-lg listmover';
		this.title(options.title);
		this.description = options.description;
		this.contentTemplate(options.contentTemplate || "modal/KendoListMoverWithSearchControl");
		this.buttonTemplate('modal/positivenegative');
		this.obPositiveButtonLabel("Apply");
	}

	KendoListMoverWithSearchControlModalViewModel.prototype = Object.create(TF.Modal.BaseModalViewModel.prototype);
	KendoListMoverWithSearchControlModalViewModel.prototype.constructor = KendoListMoverWithSearchControlModalViewModel;


	KendoListMoverWithSearchControlModalViewModel.prototype.dispose = function()
	{
		this.data().dispose();
	};
})();
