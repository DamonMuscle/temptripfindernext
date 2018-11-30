(function()
{
	var namespace = createNamespace('TF.PageLevel');
	namespace.BaseDataEntryPageLevelViewModel = BaseDataEntryPageLevelViewModel;

	function BaseDataEntryPageLevelViewModel()
	{
		namespace.BasePageLevelViewModel.call(this);

		this.obPageLevelCss = ko.observable("container");
	}

	BaseDataEntryPageLevelViewModel.prototype.constructor = BaseDataEntryPageLevelViewModel;

	BaseDataEntryPageLevelViewModel.prototype = Object.create(namespace.BasePageLevelViewModel.prototype);

	BaseDataEntryPageLevelViewModel.prototype.getValidationErrors = function(valid)
	{
		var validationErrors = namespace.BasePageLevelViewModel.prototype.getValidationErrors.call(this, valid);
		return $.grep(validationErrors, function(d)
		{
			return d.rightMessage != ' <span style="color:#68B0E9">prior to today</span>';
		});
	}
})();

