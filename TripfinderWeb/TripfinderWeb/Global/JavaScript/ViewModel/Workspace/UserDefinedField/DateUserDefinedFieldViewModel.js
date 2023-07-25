(function()
{
	createNamespace("TF.UserDefinedField").DateUserDefinedFieldViewModel = DateUserDefinedFieldViewModel;

	function DateUserDefinedFieldViewModel()
	{
		this.obIsEnable = ko.observable(true);
	};

	DateUserDefinedFieldViewModel.prototype = Object.create(TF.UserDefinedField.DateTimeUserDefinedFieldViewModel.prototype)

	DateUserDefinedFieldViewModel.prototype.constructor = DateUserDefinedFieldViewModel;

	DateUserDefinedFieldViewModel.prototype.getTemplate = function()
	{
		return null;
	};

	DateUserDefinedFieldViewModel.prototype.getDefaultValueTemplate = function()
	{
		return "<div><!-- ko customInput:{type:'Date',value:obDefaultValue,attributes:{class:'form-control',tabindex:\"4\",name:'defaultValue', adjustPopupPosition: obTypeModalData().adjustPopupPosition}} --><!-- /ko --></div>";
	};

	DateUserDefinedFieldViewModel.prototype.updateDefaultValue = function(entity, defaultValue)
	{
		entity["DefaultDate"] = defaultValue;
	};

	DateUserDefinedFieldViewModel.prototype.getDefaultValue = function(entity)
	{
		return entity["DefaultDate"];
	};
})();