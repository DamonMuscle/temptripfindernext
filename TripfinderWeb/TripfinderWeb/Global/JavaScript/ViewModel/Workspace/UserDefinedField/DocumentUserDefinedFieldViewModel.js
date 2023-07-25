(function()
{
	createNamespace("TF.UserDefinedField").DocumentUserDefinedFieldViewModel = DocumentUserDefinedFieldViewModel;

	function DocumentUserDefinedFieldViewModel(viewModel)
	{
		this.obIsEnable = ko.observable(true);
		var self = this;
		self.parent = viewModel;
	};

	DocumentUserDefinedFieldViewModel.prototype.constructor = DocumentUserDefinedFieldViewModel;

	DocumentUserDefinedFieldViewModel.prototype.getTemplate = function()
	{
		return null;
	};

	DocumentUserDefinedFieldViewModel.prototype.isRequiredFieldVisable = function()
	{
		return true;
	};

	DocumentUserDefinedFieldViewModel.prototype.isRequiredFieldEnabled = function()
	{
		return true;
	};

	DocumentUserDefinedFieldViewModel.prototype.getDefaultValueTemplate = function()
	{
		return "";
	};

	DocumentUserDefinedFieldViewModel.prototype.updateDefaultValue = function(entity, defaultValue)
	{
		//entity["DefaultMemo"] = defaultValue;
	};

	DocumentUserDefinedFieldViewModel.prototype.getDefaultValue = function(entity)
	{
		return "";
	};

})();