(function()
{
	createNamespace("TF.UserDefinedField").PhoneNumberUserDefinedFieldViewModel = PhoneNumberUserDefinedFieldViewModel;

	function PhoneNumberUserDefinedFieldViewModel()
	{
		this.obIsEnable = ko.observable(true);
	};

	PhoneNumberUserDefinedFieldViewModel.prototype.constructor = PhoneNumberUserDefinedFieldViewModel;

	PhoneNumberUserDefinedFieldViewModel.prototype.getTemplate = function()
	{
		return null;
	};

	PhoneNumberUserDefinedFieldViewModel.prototype.getDefaultValueTemplate = function()
	{
		return "<div><!-- ko customInput:{type:'Phone',value:obDefaultValue,attributes:{class:'form-control',maxlength:'18', name:'defaultValue',tabindex:'4'}} --><!-- /ko --></div>";
	};

	PhoneNumberUserDefinedFieldViewModel.prototype.updateDefaultValue = function(entity, defaultValue)
	{
		entity["DefaultPhoneNumber"] = defaultValue;
	};

	PhoneNumberUserDefinedFieldViewModel.prototype.getDefaultValue = function(entity)
	{
		return entity["DefaultPhoneNumber"];
	};
})();