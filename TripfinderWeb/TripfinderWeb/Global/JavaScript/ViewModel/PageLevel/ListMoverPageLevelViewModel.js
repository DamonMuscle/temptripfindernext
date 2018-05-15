(function()
{
	var namespace = createNamespace('TF.PageLevel');
	namespace.ListMoverPageLevelViewModel = ListMoverPageLevelViewModel;

	function ListMoverPageLevelViewModel(viewModel)
	{
		namespace.BasePageLevelViewModel.call(this);

		this.listMoverControlPanelviewModel = viewModel;
	}

	ListMoverPageLevelViewModel.prototype.constructor = ListMoverPageLevelViewModel;

	ListMoverPageLevelViewModel.prototype = Object.create(namespace.BasePageLevelViewModel.prototype);

	ListMoverPageLevelViewModel.prototype.getValidationErrorsSpecifed = function()
	{
		var validationErrors = [], selectDataCount = this.listMoverControlPanelviewModel.getSelectDataCount();
		if (selectDataCount <= 0)
		{
			validationErrors.push({ message: "At least one record must be selected." });
		}
		return validationErrors;
	}

})();

