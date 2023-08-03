(function()
{
	createNamespace("TF.UserDefinedField").TextUserDefinedFieldViewModel = TextUserDefinedFieldViewModel;
	const DEFAULT_MAX_LENGTH = 200;

	function TextUserDefinedFieldViewModel(viewModel)
	{
		this.isNew = !viewModel || !viewModel.isEdit;
		this.isCopy = viewModel && viewModel.isCopy;
		const initMaxLength = this.getInitMaxLength();
		this.obMaxLength = ko.observable(initMaxLength);
		this.maxLengthChanged.bind(this);
		this.maxLengthChanged = this.maxLengthChanged.bind(this);
		this.obIsEnable = ko.observable(false);
		this.obComponentLoaded = ko.observable(false);
	}

	TextUserDefinedFieldViewModel.prototype.constructor = TextUserDefinedFieldViewModel;

	TextUserDefinedFieldViewModel.prototype.getInitMaxLength = function()
	{
		return (this.isNew || this.isCopy) ? DEFAULT_MAX_LENGTH : null;
	}

	TextUserDefinedFieldViewModel.prototype.init = function(vm, e)
	{
		this.$parent = $(e).closest(".Edit-UDF-Modal");
		setTimeout(() => self.obComponentLoaded(true));
	};

	TextUserDefinedFieldViewModel.prototype.getTemplate = function()
	{
		return "modal/userdefinedfield/TextUserDefinedField";
	};

	TextUserDefinedFieldViewModel.prototype.getDefaultValueTemplate = function()
	{
		return `<div>
					<!-- ko customInput:{
						type:'String',
						value:obDefaultValue,
						disable:isSystemDefined,
						attributes:{name:'defaultValue',class:'form-control',maxlength:'200',tabindex:'4'}
					} -->
				<!-- /ko -->
			</div>`;
	};

	TextUserDefinedFieldViewModel.prototype.updateDefaultValue = function(entity, defaultValue)
	{
		entity["DefaultText"] = defaultValue;
	};

	TextUserDefinedFieldViewModel.prototype.getDefaultValue = function(entity)
	{
		return entity["DefaultText"];
	};

	TextUserDefinedFieldViewModel.prototype.saveSpecialValue = function(entity)
	{
		entity["MaxLength"] = this.obMaxLength();
	};

	TextUserDefinedFieldViewModel.prototype.updateSpecialValue = function(entity)
	{
		if (!entity)
		{
			return;
		}
		var maxLength = (this.isCopy && entity.Type !== 'Text') ? this.getInitMaxLength() : entity.MaxLength;
		this.obMaxLength(maxLength);
	};

	TextUserDefinedFieldViewModel.prototype.maxLengthChanged = function()
	{
		var value = this.obMaxLength();
		if (value === null ||
			value === DEFAULT_MAX_LENGTH)
		{
			return;
		}

		var intValue = parseInt(value);
		if (intValue < 0)
		{
			this.obMaxLength(0);
		}
		else if (intValue > 200)
		{
			this.obMaxLength(200);
		}

		this.updateValidator();
	};

	TextUserDefinedFieldViewModel.prototype.updateValidator = function(fields, validator)
	{
		var maxLength = this.obMaxLength();

		if (maxLength === null ||
			maxLength === DEFAULT_MAX_LENGTH)
		{
			return;
		}

		maxLength = parseInt(maxLength);

		validator || (validator = this.$parent.data("bootstrapValidator"));

		validator.options.fields.defaultValue.validators = {
			stringLength: {
				max: maxLength,
				message: 'The default value must be less than ' + maxLength + ' characters'
			}
		};
		validator.validate();
	};

	TextUserDefinedFieldViewModel.prototype.extendValidatorFields = function(validatorFields, $container)
	{
		if (!validatorFields || !$container)
		{
			return;
		}

		validatorFields.maxLength = {
			trigger: "none",
			container: $container.find("input[name='maxLength']").closest("div").parents()[1],
			validators: {
				notEmpty: {
					message: 'Max Length is required'
				}
			}
		};
	};
})();
