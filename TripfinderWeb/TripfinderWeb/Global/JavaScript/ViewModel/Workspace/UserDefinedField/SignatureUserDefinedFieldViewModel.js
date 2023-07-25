(function()
{
	createNamespace("TF.UserDefinedField").SignatureUserDefinedFieldViewModel = SignatureUserDefinedFieldViewModel;

	function SignatureUserDefinedFieldViewModel(viewModel)
	{
		this.obIsEnable = ko.observable(true);
		var self = this;
		self.parent = viewModel;
	};

	SignatureUserDefinedFieldViewModel.prototype.constructor = SignatureUserDefinedFieldViewModel;

	SignatureUserDefinedFieldViewModel.prototype.getTemplate = function()
	{
		return null;
	};

	SignatureUserDefinedFieldViewModel.prototype.getDefaultValueTemplate = function()
	{
		return "";
	};

	SignatureUserDefinedFieldViewModel.prototype.isRequiredFieldVisable = function()
	{
		return true;
	};

	SignatureUserDefinedFieldViewModel.prototype.isRequiredFieldEnabled = function()
	{
		return true;
	};

	SignatureUserDefinedFieldViewModel.prototype.updateDefaultValue = function(entity, defaultValue)
	{
		//entity["DefaultMemo"] = defaultValue;
	};

	SignatureUserDefinedFieldViewModel.prototype.getDefaultValue = function(entity)
	{
		return "";
	};

})();