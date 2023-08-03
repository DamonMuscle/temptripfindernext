(function()
{
	createNamespace("TF.UserDefinedField").EmailUserDefinedFieldViewModel = EmailUserDefinedFieldViewModel;

	function EmailUserDefinedFieldViewModel(viewModel)
	{
		this.isNew = !viewModel || !viewModel.isEdit;
		this.isCopy = viewModel && viewModel.isCopy;
		this.obIsEnable = ko.observable(false);
		this.obComponentLoaded = ko.observable(false);
	}

	EmailUserDefinedFieldViewModel.prototype.constructor = EmailUserDefinedFieldViewModel;

	EmailUserDefinedFieldViewModel.prototype.init = function(vm, e)
	{
		this.$parent = $(e).closest(".Edit-UDF-Modal");
		this.obComponentLoaded(true);
	};

	EmailUserDefinedFieldViewModel.prototype.getTemplate = function()
	{
		return null;
	};

	EmailUserDefinedFieldViewModel.prototype.getDefaultValueTemplate = function()
	{
		return `<div>
					<!-- ko customInput:{
						type:'Email',
						value:obDefaultValue,
						disable:isSystemDefined,
						attributes:{name:'defaultValue',class:'form-control',maxlength:'200',tabindex:'4'}
					} -->
				<!-- /ko -->
			</div>`;
	};

	EmailUserDefinedFieldViewModel.prototype.updateDefaultValue = function(entity, defaultValue)
	{
		entity["DefaultEmail"] = defaultValue;
	};

	EmailUserDefinedFieldViewModel.prototype.getDefaultValue = function(entity)
	{
		return entity["DefaultEmail"];
	};
})();
