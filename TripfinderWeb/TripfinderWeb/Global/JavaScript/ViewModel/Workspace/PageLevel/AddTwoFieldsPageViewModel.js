(function()
{
	var namespace = createNamespace('TF.PageLevel');
	namespace.AddTwoFieldsPageViewModel = AddTwoFieldsPageViewModel;

	function AddTwoFieldsPageViewModel()
	{
		namespace.BasePageLevelViewModel.call(this);
	}

	AddTwoFieldsPageViewModel.prototype.constructor = AddTwoFieldsPageViewModel;

	AddTwoFieldsPageViewModel.prototype = Object.create(namespace.BasePageLevelViewModel.prototype);
})();

