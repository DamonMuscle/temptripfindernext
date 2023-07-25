(function()
{
	createNamespace("TF.UserDefinedField").TimeUserDefinedFieldViewModel = TimeUserDefinedFieldViewModel;

	function TimeUserDefinedFieldViewModel()
	{
		this.obIsEnable = ko.observable(true);
	};

	TimeUserDefinedFieldViewModel.prototype.getTemplate = function()
	{
		return null;
	};

	TimeUserDefinedFieldViewModel.prototype.getDefaultValueTemplate = function()
	{
		return "<div><!-- ko customInput:{type:'Time',value:obDefaultValue,attributes:{class:'form-control',tabindex:'4'}} --><!-- /ko --></div>";
	};

	TimeUserDefinedFieldViewModel.prototype.updateDefaultValue = function(entity, defaultValue)
	{
		if (defaultValue == null)
		{
			entity["DefaultTime"] = null;
			return;
		}

		var momentObj = moment(defaultValue);
		if (momentObj.isValid())
		{
			entity["DefaultTime"] = momentObj.format("HH:mm:ss");
			return;
		}

		momentObj = moment("12/30/1899 " + defaultValue);
		if (momentObj.isValid())
		{
			entity["DefaultTime"] = momentObj.format("HH:mm:ss");
		}
	};

	TimeUserDefinedFieldViewModel.prototype.getDefaultValue = function(entity)
	{
		return entity["DefaultTime"];
	};
})();