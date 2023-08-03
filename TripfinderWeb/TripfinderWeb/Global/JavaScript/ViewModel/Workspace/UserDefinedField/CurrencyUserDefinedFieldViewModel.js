(function()
{
	createNamespace("TF.UserDefinedField").CurrencyUserDefinedFieldViewModel = CurrencyUserDefinedFieldViewModel;
	const DEFAULT_DECIMAL_PLACES = 2;

	function CurrencyUserDefinedFieldViewModel(viewModel)
	{
		this.parent = viewModel;
		this.isNew = !viewModel || !viewModel.isEdit;
		this.isCopy = viewModel && viewModel.isCopy;
		const initMaxLength = this.getInitMaxLength();
		this.obMaxLength = ko.observable(initMaxLength);
		this.maxLengthChanged.bind(this);
		this.maxLengthChanged = this.maxLengthChanged.bind(this);
		this.parent.onBlur = this.onBlur.bind(this);
		this.obIsEnable = ko.observable(false);
		this.obComponentLoaded = ko.observable(false);
	}

	CurrencyUserDefinedFieldViewModel.prototype.constructor = CurrencyUserDefinedFieldViewModel;

	CurrencyUserDefinedFieldViewModel.prototype.getInitMaxLength = function()
	{
		return this.isNew ? DEFAULT_DECIMAL_PLACES : null;
	}

	CurrencyUserDefinedFieldViewModel.prototype.init = function(vm, e)
	{
		var self = this;
		this.$parent = $(e).closest(".Edit-UDF-Modal");
		setTimeout(() => self.obComponentLoaded(true));
	};

	CurrencyUserDefinedFieldViewModel.prototype.getTemplate = function()
	{
		return "modal/userdefinedfield/CurrencyUserDefinedField";
	};

	CurrencyUserDefinedFieldViewModel.prototype.getDefaultValueTemplate = function()
	{
		return `<div>
			<!-- ko customInput:{
				type:'String',
				value:obDefaultValue,
				disable:isSystemDefined,
				events:{blur:onBlur},
				attributes:{name:'defaultValue',
				class:'form-control',maxlength:'50',tabindex:'4'}
			} -->
			<!-- /ko -->
		</div>`;
	};

	CurrencyUserDefinedFieldViewModel.prototype.updateDefaultValue = function(entity, defaultValue)
	{
		entity["DefaultText"] = defaultValue;
	};

	CurrencyUserDefinedFieldViewModel.prototype.getDefaultValue = function(entity)
	{
		return entity["DefaultText"];
	};

	CurrencyUserDefinedFieldViewModel.prototype.saveSpecialValue = function(entity)
	{
		entity["MaxLength"] = this.obMaxLength();
	};

	CurrencyUserDefinedFieldViewModel.prototype.updateSpecialValue = function(entity)
	{
		if (!entity)
		{
			return;
		}

		const maxLength = (this.isCopy && entity.Type !== 'Currency') ? this.getInitMaxLength() : entity.MaxLength;
		this.obMaxLength(maxLength);
	};

	CurrencyUserDefinedFieldViewModel.prototype.maxLengthChanged = function()
	{
		var self = this, value = this.obMaxLength(), defaultValue = self.parent.obDefaultValue();
		if (value === null)
		{
			return;
		}

		var intValue = parseInt(value);
		if (intValue < 0)
		{
			this.obMaxLength(0);
		}
		else if (intValue > 9)
		{
			this.obMaxLength(9);
		}
		if (!defaultValue) return;
		var decimalPlaces = self.obMaxLength() === '' ? 2 : self.obMaxLength(),
			defaultValue = parseFloat(defaultValue);
		self.parent.obDefaultValue(defaultValue.toFixed(decimalPlaces));
	};

	CurrencyUserDefinedFieldViewModel.prototype.onBlur = function(currencyBox, e)
	{
		var self = this,
			value = currencyBox.$input.val(),
			floatValue = parseFloat(value),
			decimalPlaces = self.obMaxLength(),
			index = value.indexOf('.');

		if (isNaN(Number(value)))
		{
			currencyBox.$input.val("");
			return;
		}

		if (decimalPlaces === null)
		{
			return;
		}
		if (value === '')
		{
			return;
		}

		// cut the float with decimal places.
		var count = value.length - index - 1;
		if (count > decimalPlaces)
		{
			let kappa = Math.pow(10, decimalPlaces);
			let floorValue = Math.floor(floatValue * kappa) / kappa
			let validValue = floorValue.toFixed(decimalPlaces);
			currencyBox.$input.val(validValue);
			currencyBox.value(validValue);
		}
	};

	CurrencyUserDefinedFieldViewModel.prototype.updateValidator = function()
	{
		var maxLength = this.obMaxLength();

		if (maxLength === DEFAULT_DECIMAL_PLACES)
		{
			return;
		}

	};

	CurrencyUserDefinedFieldViewModel.prototype.extendValidatorFields = function(validatorFields, $container)
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
					message: 'Decimal place is required'
				},
				numeric: {
					message: 'Please enter a valid currency'
				}
			}
		};
	};
})();
